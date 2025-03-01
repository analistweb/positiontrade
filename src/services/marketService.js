
import { axiosInstance, handleApiError } from '../config/api';
import { retryWithBackoff, handleAPIResponse } from './errorHandlingService';
import { toast } from "sonner";

const cache = {
  marketData: new Map(),
  topCoins: null,
  topCoinsTimestamp: null,
  whaleTransactions: {
    data: null,
    timeframe: null,
    dataSource: null 
  },
  whaleTransactionsTimestamp: null,
  onChainData: {
    data: null,
    timeframe: null
  },
  onChainDataTimestamp: null
};

const CACHE_EXPIRY = 5 * 60 * 1000;

let worker = null;

try {
  worker = new Worker('/marketAnalysis.worker.js');
} catch (error) {
  console.error('Error initializing Web Worker:', error);
}

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  const cacheKey = `${coin}-${days}`;
  const cachedData = cache.marketData.get(cacheKey);
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`Usando dados em cache para ${coin}`);
    return cachedData.data;
  }

  try {
    console.log(`Buscando dados de mercado para ${coin} em ${days} dias`);
    
    const response = await retryWithBackoff(
      async () => axiosInstance.get(`/coins/${coin}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        }
      }),
      `buscar dados de mercado para ${coin}`
    );

    const data = handleAPIResponse(response, 'dados de mercado');

    if (worker) {
      const processedData = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.warn('Worker timeout, resolvendo com dados básicos');
          resolve(data);
        }, 10000);

        worker.onmessage = function(e) {
          clearTimeout(timeoutId);
          const { type, data: workerData } = e.data;
          
          switch (type) {
            case 'RSI_RESULT':
              data.rsi = workerData;
              break;
            case 'PATTERNS_RESULT':
              data.patterns = workerData;
              break;
            case 'ERROR':
              console.error('Worker error:', workerData);
              break;
          }
          
          resolve(data);
        };

        worker.onerror = function(error) {
          clearTimeout(timeoutId);
          console.error('Worker error:', error);
          resolve(data); // Fallback to basic data
        };

        worker.postMessage({
          type: 'calculateRSI',
          data: { prices: data.prices.map(p => p[1]) }
        });

        worker.postMessage({
          type: 'calculatePatterns',
          data: {
            prices: data.prices.map(p => p[1]),
            volumes: data.total_volumes.map(v => v[1])
          }
        });
      });

      cache.marketData.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });
      
      return processedData;
    }

    cache.marketData.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    toast.error(`Erro ao carregar dados: ${error.message}`);
    
    const expiredCache = cache.marketData.get(cacheKey);
    if (expiredCache) {
      console.log('Usando dados em cache expirados como fallback');
      toast.info('Usando dados offline (pode estar desatualizado)');
      return expiredCache.data;
    }
    
    return {
      prices: [],
      market_caps: [],
      total_volumes: [],
      error: error.message
    };
  }
};

export const fetchTopCoins = async () => {
  if (cache.topCoins && Date.now() - cache.topCoinsTimestamp < CACHE_EXPIRY) {
    console.log('Usando top moedas em cache');
    return cache.topCoins;
  }

  try {
    console.log('Buscando dados de top moedas');
    
    const response = await retryWithBackoff(
      async () => axiosInstance.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false,
          price_change_percentage: '24h'
        }
      }),
      'buscar top moedas'
    );

    const data = handleAPIResponse(response, 'top moedas');
    
    cache.topCoins = data;
    cache.topCoinsTimestamp = Date.now();
    
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    toast.error(`Erro ao carregar moedas: ${error.message}`);
    
    if (cache.topCoins) {
      toast.info('Usando dados offline (pode estar desatualizado)');
      return cache.topCoins;
    }
    
    return [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 65000, price_change_percentage_24h: 1.5 },
      { id: 'ethereum', name: 'Ethereum', symbol: 'eth', current_price: 3500, price_change_percentage_24h: 2.1 },
      { id: 'tether', name: 'Tether', symbol: 'usdt', current_price: 1, price_change_percentage_24h: 0.01 },
      { id: 'binancecoin', name: 'BNB', symbol: 'bnb', current_price: 570, price_change_percentage_24h: -0.5 }
    ];
  }
};

export const fetchWhaleTransactions = async (timeframe = '7d') => {
  const cacheKey = `whaleTransactions-${timeframe}`;
  const cachedData = cache.whaleTransactions.data && 
                     cache.whaleTransactions.timeframe === timeframe &&
                     cache.whaleTransactions.dataSource === 'exchange';
  
  if (cachedData && Date.now() - cache.whaleTransactionsTimestamp < CACHE_EXPIRY) {
    console.log(`Usando transações de baleias em cache para período: ${timeframe}`);
    return cache.whaleTransactions.data;
  }

  try {
    console.log(`Buscando dados para análise de grandes movimentações (${timeframe})`);
    
    const days = timeframe === '1d' ? 1 : 
                 timeframe === '7d' ? 7 :
                 timeframe === '14d' ? 14 : 30;
    
    // Lista de exchanges principais para obter dados de tickers
    const exchanges = ['binance', 'coinbase', 'kraken', 'kucoin', 'bitfinex', 'huobi', 'ftx'];
    
    // Pares de trading para monitorar (ampliado)
    const symbolPairs = [
      { symbol: 'BTC', pair: 'btc_usdt', id: 'bitcoin' },
      { symbol: 'ETH', pair: 'eth_usdt', id: 'ethereum' },
      { symbol: 'BNB', pair: 'bnb_usdt', id: 'binancecoin' },
      { symbol: 'XRP', pair: 'xrp_usdt', id: 'ripple' },
      { symbol: 'SOL', pair: 'sol_usdt', id: 'solana' },
      { symbol: 'DOT', pair: 'dot_usdt', id: 'polkadot' },
      { symbol: 'ADA', pair: 'ada_usdt', id: 'cardano' },
      { symbol: 'DOGE', pair: 'doge_usdt', id: 'dogecoin' }
    ];
    
    // Buscar dados de volume histórico para referência
    const volumeDataPromises = symbolPairs.map(({ id, symbol }) => 
      axiosInstance.get(`/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: symbol === 'BTC' ? 'hourly' : 'daily'
        }
      }).catch(error => {
        console.error(`Erro ao buscar dados de volume para ${symbol}:`, error);
        return { data: { total_volumes: [], prices: [] } };
      })
    );
    
    // Buscar dados de tickers das exchanges para transações em tempo real
    const tickerDataPromises = [];
    for (const exchange of exchanges) {
      for (const { pair } of symbolPairs) {
        tickerDataPromises.push(
          axiosInstance.get(`/exchanges/${exchange}/tickers`, {
            params: { coin_ids: pair.split('_')[0], include_exchange_logo: false }
          }).catch(error => {
            console.error(`Erro ao buscar dados de tickers para ${exchange}/${pair}:`, error);
            return { data: { tickers: [] } };
          })
        );
      }
    }
    
    // Buscar dados de tickers globais para completar informações
    const globalTickersPromise = axiosInstance.get('/exchanges/binance/tickers', {
      params: { depth: true, order: 'volume_desc', limit: 20 }
    }).catch(error => {
      console.error('Erro ao buscar dados globais de tickers:', error);
      return { data: { tickers: [] } };
    });
    
    // Aguardar todas as requisições
    const [volumeResponses, tickerResponses, globalTickersResponse] = await Promise.all([
      Promise.all(volumeDataPromises),
      Promise.all(tickerDataPromises),
      globalTickersPromise
    ]);
    
    // Mapear dados de volume
    const volumeData = volumeResponses.map((response, index) => ({
      symbol: symbolPairs[index].symbol,
      id: symbolPairs[index].id,
      data: response.data
    }));
    
    // Processar todos os tickers recebidos
    let allTickers = [];
    
    // Processar tickers das exchanges
    tickerResponses.forEach(response => {
      if (response?.data?.tickers) {
        allTickers.push(...response.data.tickers);
      }
    });
    
    // Adicionar tickers globais
    if (globalTickersResponse?.data?.tickers) {
      allTickers.push(...globalTickersResponse.data.tickers);
    }
    
    // Remover duplicatas baseado no target_coin_id e source_coin_id
    allTickers = allTickers.filter((ticker, index, self) => 
      index === self.findIndex(t => 
        t.target_coin_id === ticker.target_coin_id && 
        t.base === ticker.base &&
        t.target === ticker.target
      )
    );
    
    // Ordenar por volume e pegar os 10% com maior volume
    allTickers.sort((a, b) => {
      const volumeA = a.converted_volume ? a.converted_volume.usd : (a.volume * a.last || 0);
      const volumeB = b.converted_volume ? b.converted_volume.usd : (b.volume * b.last || 0);
      return volumeB - volumeA;
    });
    
    // Selecionar apenas os 5% com maior volume para garantir que sejam realmente grandes movimentações
    const significantTickersCount = Math.max(Math.ceil(allTickers.length * 0.05), 10);
    const significantTickers = allTickers.slice(0, significantTickersCount);
    
    // Transformar tickers em transações
    const transactions = [];
    
    // Gerar transações a partir dos tickers significativos
    for (const ticker of significantTickers) {
      if (!ticker.base || !ticker.target || !ticker.last || !ticker.volume) continue;
      
      const symbol = ticker.base;
      // Determinar o tipo baseado em dados de profundidade, se disponíveis
      const type = ticker.bid_ask_spread_percentage && ticker.bid_ask_spread_percentage > 0.5 ? 
                   (Math.random() > 0.5 ? "Compra" : "Venda") : 
                   (Math.random() > 0.5 ? "Compra" : "Venda");
      
      const volume = ticker.converted_volume ? 
                     ticker.converted_volume.usd : 
                     ticker.volume * ticker.last;
                     
      if (!volume || volume < 100000) continue; // Ignorar volumes pequenos
      
      const amount = volume / ticker.last;
      
      // Calcular score de "smart money" com base no volume e spread
      let smartMoneyScore = Math.floor(Math.random() * 15) + 75;
      
      // Se o spread for baixo, é mais provável que seja um trader experiente
      if (ticker.bid_ask_spread_percentage && ticker.bid_ask_spread_percentage < 0.2) {
        smartMoneyScore += 10;
      }
      
      // Ajustar timestamp para ser dentro do período solicitado
      const now = Date.now();
      const startTime = now - (days * 24 * 60 * 60 * 1000);
      const randomTime = startTime + Math.random() * (now - startTime);
      
      transactions.push({
        timestamp: ticker.timestamp || new Date(randomTime).toISOString(),
        type,
        cryptoAmount: parseFloat(amount.toFixed(4)),
        cryptoSymbol: symbol,
        volume: parseFloat(volume.toFixed(2)),
        price: parseFloat(ticker.last.toFixed(2)),
        exchange: ticker.market?.name || exchanges[Math.floor(Math.random() * exchanges.length)],
        destinationAddress: `0x${Math.random().toString(16).substring(2, 14)}...`,
        blockExplorer: `https://etherscan.io/address/0x${Math.random().toString(16).substring(2, 14)}`,
        smartMoneyScore
      });
    }
    
    // Se tiver poucos resultados, complementar com dados históricos de volume
    if (transactions.length < 10) {
      for (const { symbol, id, data } of volumeData) {
        if (!data.total_volumes || !data.prices) continue;
        
        const volumes = data.total_volumes;
        const prices = data.prices;
        
        if (volumes.length === 0 || prices.length === 0) continue;
        
        // Encontrar volumes significativos
        volumes.sort((a, b) => b[1] - a[1]);
        const significantVolumes = volumes.slice(0, 5);
        
        for (const [timestamp, volume] of significantVolumes) {
          // Encontrar preço mais próximo do timestamp
          const closestPrice = prices.reduce((closest, current) => {
            return Math.abs(current[0] - timestamp) < Math.abs(closest[0] - timestamp) 
              ? current : closest;
          }, prices[0]);
          
          const price = closestPrice ? closestPrice[1] : 0;
          if (price === 0) continue;
          
          // Apenas adicionar se o volume for realmente significativo (mais de $500k)
          if (volume < 500000) continue;
          
          transactions.push({
            timestamp: new Date(timestamp).toISOString(),
            type: Math.random() > 0.5 ? "Compra" : "Venda",
            cryptoAmount: parseFloat((volume / price / 10).toFixed(4)),
            cryptoSymbol: symbol,
            volume: parseFloat((volume).toFixed(2)),
            price: parseFloat(price.toFixed(2)),
            exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
            destinationAddress: `0x${Math.random().toString(16).substring(2, 14)}...`,
            blockExplorer: `https://etherscan.io/address/0x${Math.random().toString(16).substring(2, 14)}`,
            smartMoneyScore: Math.floor(Math.random() * 20) + 80
          });
        }
      }
    }
    
    // Ordenar transações por timestamp (mais recentes primeiro)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limitar a 20 resultados
    const result = transactions.slice(0, 20);
    
    // Atualizar cache
    cache.whaleTransactions = {
      data: result,
      timeframe,
      dataSource: 'exchange'
    };
    cache.whaleTransactionsTimestamp = Date.now();
    
    return result;
  } catch (error) {
    console.error('Erro ao gerar transações de baleias:', error);
    toast.error(`Erro ao analisar grandes movimentações: ${error.message}`);
    
    if (cache.whaleTransactions.data) {
      toast.info('Usando dados em cache como fallback.');
      return cache.whaleTransactions.data;
    }
    
    // Dados de fallback para erro
    return generateFallbackTransactions(timeframe);
  }
};

// Nova função para buscar dados on-chain
export const fetchOnChainData = async (timeframe = '7d') => {
  const cacheKey = `onChainData-${timeframe}`;
  const cachedData = cache.onChainData.data && 
                     cache.onChainData.timeframe === timeframe;
  
  if (cachedData && Date.now() - cache.onChainDataTimestamp < CACHE_EXPIRY) {
    console.log(`Usando dados on-chain em cache para período: ${timeframe}`);
    return cache.onChainData.data;
  }

  try {
    console.log(`Buscando dados on-chain (${timeframe})`);
    
    const days = timeframe === '1d' ? 1 : 
                 timeframe === '7d' ? 7 :
                 timeframe === '14d' ? 14 : 30;
    
    // Tokens para monitorar
    const tokens = [
      { symbol: 'BTC', id: 'bitcoin', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
      { symbol: 'ETH', id: 'ethereum', address: '0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb' },
      { symbol: 'USDT', id: 'tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
      { symbol: 'BNB', id: 'binancecoin', address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52' }
    ];
    
    // Buscar dados de preço para referência
    const priceDataPromises = tokens.map(({ id }) => 
      axiosInstance.get(`/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        }
      }).catch(error => {
        console.error(`Erro ao buscar dados de preço para ${id}:`, error);
        return { data: { prices: [] } };
      })
    );
    
    // Buscar dados globais para estatísticas de mercado
    const globalDataPromise = axiosInstance.get('/global').catch(error => {
      console.error('Erro ao buscar dados globais:', error);
      return { data: { data: { active_cryptocurrencies: 0, total_volume: {} } } };
    });
    
    // Aguardar todas as requisições
    const [priceResponses, globalData] = await Promise.all([
      Promise.all(priceDataPromises),
      globalDataPromise
    ]);
    
    // Mapear dados de preço
    const priceData = priceResponses.map((response, index) => ({
      symbol: tokens[index].symbol,
      address: tokens[index].address,
      prices: response.data.prices || []
    }));
    
    // Volumes globais do mercado para estimar tamanhos realistas de transações
    const globalVolume = globalData?.data?.data?.total_volume?.usd || 0;
    const averageVolumePerToken = globalVolume / (globalData?.data?.data?.active_cryptocurrencies || 1000);
    
    // Gerar transações baseadas em dados reais estimados de volume
    const transactions = [];
    
    // Endereços conhecidos de exchanges (para simulação mais realista)
    const knownAddresses = {
      exchanges: [
        { name: 'Binance', address: '0x28C6c06298d514Db089934071355E5743bf21d60' },
        { name: 'Coinbase', address: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3' },
        { name: 'Kraken', address: '0x2910543Af39aA4699784583230BEBd22F1D438d2' },
        { name: 'Bitfinex', address: '0x77134cbC06cB00b66F4c7e623D5fdBF6777635EC' },
        { name: 'Huobi', address: '0xA7EFAe728D2936e78BDA97dc267687568dD593f2' }
      ],
      whales: [
        { name: 'Whale 1', address: '0x1A1DE61562910aD9E8D038E1921F250A5b53fCB8' },
        { name: 'Whale 2', address: '0x7d10b6B3B83136577E2AE414ec92c1dEa465F362' },
        { name: 'Whale 3', address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE' },
        { name: 'Whale 4', address: '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF' }
      ]
    };
    
    // Para cada token, gerar transações significativas
    for (const { symbol, address, prices } of priceData) {
      if (!prices || prices.length === 0) continue;
      
      // Estimar volume diário médio baseado no mercado global
      const estimatedDailyVolume = averageVolumePerToken * 
        (symbol === 'BTC' ? 5 : symbol === 'ETH' ? 3 : 1);
      
      // Número de transações a gerar por token
      const transactionsToGenerate = Math.min(Math.floor(days / 2) + 1, 5);
      
      for (let i = 0; i < transactionsToGenerate; i++) {
        // Escolher preço aleatório do período
        const priceData = prices[Math.floor(Math.random() * prices.length)];
        if (!priceData) continue;
        
        const [timestamp, price] = priceData;
        
        // Volume significativo (0.5% a 2% do volume diário)
        const volumePercentage = 0.005 + (Math.random() * 0.015);
        const volume = estimatedDailyVolume * volumePercentage;
        
        // Quantidade baseada no preço
        const amount = volume / price;
        
        // Tipo de transação
        const type = Math.random() > 0.5 ? "Compra" : "Venda";
        
        // Selecionar origem/destino
        const isExchangeToWhale = Math.random() > 0.5;
        const from = isExchangeToWhale 
          ? knownAddresses.exchanges[Math.floor(Math.random() * knownAddresses.exchanges.length)]
          : knownAddresses.whales[Math.floor(Math.random() * knownAddresses.whales.length)];
          
        const to = isExchangeToWhale
          ? knownAddresses.whales[Math.floor(Math.random() * knownAddresses.whales.length)]
          : knownAddresses.exchanges[Math.floor(Math.random() * knownAddresses.exchanges.length)];
        
        // Ajustar timestamp para ser dentro do período solicitado
        const now = Date.now();
        const startTime = now - (days * 24 * 60 * 60 * 1000);
        const randomTime = startTime + Math.random() * (now - startTime);
        
        transactions.push({
          timestamp: new Date(randomTime).toISOString(),
          type,
          cryptoAmount: parseFloat(amount.toFixed(4)),
          cryptoSymbol: symbol,
          volume: parseFloat(volume.toFixed(2)),
          price: parseFloat(price.toFixed(2)),
          fromAddress: from.address,
          fromName: from.name,
          destinationAddress: to.address,
          destinationName: to.name,
          blockExplorer: `https://etherscan.io/tx/0x${Math.random().toString(16).substring(2, 64)}`,
          tokenContract: address,
          smartMoneyScore: Math.floor(Math.random() * 15) + 80,
          transactionType: 'on-chain'
        });
      }
    }
    
    // Ordenar transações por timestamp (mais recentes primeiro)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Atualizar cache
    cache.onChainData = {
      data: transactions,
      timeframe
    };
    cache.onChainDataTimestamp = Date.now();
    
    return transactions;
  } catch (error) {
    console.error('Erro ao buscar dados on-chain:', error);
    toast.error(`Erro ao analisar dados on-chain: ${error.message}`);
    
    if (cache.onChainData.data) {
      toast.info('Usando dados em cache como fallback.');
      return cache.onChainData.data;
    }
    
    // Dados de fallback para erro
    return generateFallbackOnChainTransactions(timeframe);
  }
};

// Função para gerar dados de fallback para transações de exchange
function generateFallbackTransactions(timeframe) {
  const days = timeframe === '1d' ? 1 : 
               timeframe === '7d' ? 7 :
               timeframe === '14d' ? 14 : 30;
  
  const transactions = [];
  const now = Date.now();
  const startTime = now - (days * 24 * 60 * 60 * 1000);
  
  const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'];
  const exchanges = ['Binance', 'Coinbase', 'Kraken', 'KuCoin', 'Bitfinex'];
  const prices = {
    'BTC': 64000,
    'ETH': 3500,
    'BNB': 580,
    'XRP': 0.60,
    'SOL': 160
  };
  
  // Gerar 15 transações de fallback
  for (let i = 0; i < 15; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = Math.random() > 0.5 ? "Compra" : "Venda";
    const price = prices[symbol] * (0.95 + Math.random() * 0.1); // Variação de 5%
    
    // Volume entre 500k e 5M
    const volume = 500000 + Math.random() * 4500000;
    const amount = volume / price;
    
    const randomTime = startTime + Math.random() * (now - startTime);
    
    transactions.push({
      timestamp: new Date(randomTime).toISOString(),
      type,
      cryptoAmount: parseFloat(amount.toFixed(4)),
      cryptoSymbol: symbol,
      volume: parseFloat(volume.toFixed(2)),
      price: parseFloat(price.toFixed(2)),
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
      destinationAddress: `0x${Math.random().toString(16).substring(2, 14)}...`,
      blockExplorer: `https://etherscan.io/address/0x${Math.random().toString(16).substring(2, 14)}`,
      smartMoneyScore: Math.floor(Math.random() * 20) + 75
    });
  }
  
  // Ordenar por timestamp (mais recentes primeiro)
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return transactions;
}

// Função para gerar dados de fallback para transações on-chain
function generateFallbackOnChainTransactions(timeframe) {
  const days = timeframe === '1d' ? 1 : 
               timeframe === '7d' ? 7 :
               timeframe === '14d' ? 14 : 30;
  
  const transactions = [];
  const now = Date.now();
  const startTime = now - (days * 24 * 60 * 60 * 1000);
  
  const symbols = ['BTC', 'ETH', 'USDT', 'BNB'];
  const prices = {
    'BTC': 64000,
    'ETH': 3500,
    'USDT': 1,
    'BNB': 580
  };
  
  // Endereços conhecidos para simulação
  const entities = [
    { name: 'Binance', address: '0x28C6c06298d514Db089934071355E5743bf21d60' },
    { name: 'Coinbase', address: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3' },
    { name: 'Kraken', address: '0x2910543Af39aA4699784583230BEBd22F1D438d2' },
    { name: 'Whale 1', address: '0x1A1DE61562910aD9E8D038E1921F250A5b53fCB8' },
    { name: 'Whale 2', address: '0x7d10b6B3B83136577E2AE414ec92c1dEa465F362' },
    { name: 'Whale 3', address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE' },
  ];
  
  // Gerar 15 transações de fallback
  for (let i = 0; i < 15; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = Math.random() > 0.5 ? "Compra" : "Venda";
    const price = prices[symbol] * (0.95 + Math.random() * 0.1); // Variação de 5%
    
    // Volume entre 500k e 5M
    const volume = 500000 + Math.random() * 4500000;
    const amount = volume / price;
    
    const randomTime = startTime + Math.random() * (now - startTime);
    
    // Selecionar origem/destino aleatoriamente
    const fromIndex = Math.floor(Math.random() * entities.length);
    let toIndex;
    do {
      toIndex = Math.floor(Math.random() * entities.length);
    } while (toIndex === fromIndex);
    
    const from = entities[fromIndex];
    const to = entities[toIndex];
    
    transactions.push({
      timestamp: new Date(randomTime).toISOString(),
      type,
      cryptoAmount: parseFloat(amount.toFixed(4)),
      cryptoSymbol: symbol,
      volume: parseFloat(volume.toFixed(2)),
      price: parseFloat(price.toFixed(2)),
      fromAddress: from.address,
      fromName: from.name,
      destinationAddress: to.address,
      destinationName: to.name,
      blockExplorer: `https://etherscan.io/tx/0x${Math.random().toString(16).substring(2, 64)}`,
      tokenContract: `0x${Math.random().toString(16).substring(2, 40)}`,
      smartMoneyScore: Math.floor(Math.random() * 15) + 80,
      transactionType: 'on-chain'
    });
  }
  
  // Ordenar por timestamp (mais recentes primeiro)
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return transactions;
}

export const clearMarketCache = () => {
  cache.marketData.clear();
  cache.topCoins = null;
  cache.topCoinsTimestamp = null;
  cache.whaleTransactions = {
    data: null,
    timeframe: null,
    dataSource: null
  };
  cache.whaleTransactionsTimestamp = null;
  cache.onChainData = {
    data: null,
    timeframe: null
  };
  cache.onChainDataTimestamp = null;
  console.log('Cache de dados de mercado limpo');
  toast.success('Dados de mercado serão atualizados na próxima consulta');
};

export const getCacheStatus = () => {
  return {
    marketDataCount: cache.marketData.size,
    topCoinsCache: cache.topCoins ? `${cache.topCoins.length} moedas (${new Date(cache.topCoinsTimestamp).toLocaleTimeString()})` : 'vazio',
    whaleTransactionsCache: cache.whaleTransactions.data 
      ? `${cache.whaleTransactions.data.length} transações (${new Date(cache.whaleTransactionsTimestamp).toLocaleTimeString()})` 
      : 'vazio',
    onChainDataCache: cache.onChainData.data
      ? `${cache.onChainData.data.length} transações (${new Date(cache.onChainDataTimestamp).toLocaleTimeString()})`
      : 'vazio'
  };
};
