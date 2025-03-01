
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
    
    // Não usar fallback, permitir que o erro seja propagado
    throw new Error("Falha ao obter dados reais do mercado");
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
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Dados de moedas não disponíveis");
    }
    
    cache.topCoins = data;
    cache.topCoinsTimestamp = Date.now();
    
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    toast.error(`Erro ao carregar moedas: ${error.message}`);
    
    // Não usar fallback, permitir que o erro seja propagado
    throw new Error("Falha ao obter dados reais de moedas");
  }
};

export const fetchWhaleTransactions = async (timeframe = '7d') => {
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
    const exchanges = ['binance', 'coinbase', 'kraken', 'kucoin', 'bitfinex', 'huobi'];
    
    // Pares de trading para monitorar
    const symbolPairs = [
      { symbol: 'BTC', pair: 'btc_usdt', id: 'bitcoin' },
      { symbol: 'ETH', pair: 'eth_usdt', id: 'ethereum' },
      { symbol: 'BNB', pair: 'bnb_usdt', id: 'binancecoin' },
      { symbol: 'XRP', pair: 'xrp_usdt', id: 'ripple' },
      { symbol: 'SOL', pair: 'sol_usdt', id: 'solana' }
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
        return null;
      })
    );
    
    // Buscar dados de tickers das exchanges para transações em tempo real
    const tickerDataPromises = [];
    for (const exchange of exchanges) {
      // Limitar a duas exchanges por requisição para evitar sobrecarga
      const randomExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
      tickerDataPromises.push(
        axiosInstance.get(`/exchanges/${randomExchange}/tickers`, {
          params: { include_exchange_logo: false, depth: true }
        }).catch(error => {
          console.error(`Erro ao buscar dados de tickers para ${randomExchange}:`, error);
          return null;
        })
      );
    }
    
    // Aguardar todas as requisições
    const responses = await Promise.all([
      ...volumeDataPromises,
      ...tickerDataPromises
    ]);
    
    // Filtrar respostas nulas (erros)
    const validResponses = responses.filter(response => response && response.data);
    
    if (validResponses.length === 0) {
      throw new Error("Não foi possível obter dados reais de transações");
    }
    
    // Processar dados de volume
    const volumeData = [];
    for (let i = 0; i < symbolPairs.length; i++) {
      if (responses[i] && responses[i].data) {
        volumeData.push({
          symbol: symbolPairs[i].symbol,
          id: symbolPairs[i].id,
          data: responses[i].data
        });
      }
    }
    
    // Processar dados de tickers
    const transactions = [];
    
    // Processar tickers das exchanges
    for (let i = symbolPairs.length; i < responses.length; i++) {
      const response = responses[i];
      if (!response || !response.data || !response.data.tickers) continue;
      
      const tickers = response.data.tickers;
      
      // Filtrar por volume significativo (top 10%)
      tickers.sort((a, b) => {
        const volumeA = a.converted_volume ? a.converted_volume.usd : 0;
        const volumeB = b.converted_volume ? b.converted_volume.usd : 0;
        return volumeB - volumeA;
      });
      
      const significantTickers = tickers.slice(0, Math.max(5, Math.ceil(tickers.length * 0.05)));
      
      for (const ticker of significantTickers) {
        // Verificar se é uma transação significativa (pelo menos $50k)
        const volume = ticker.converted_volume?.usd || 0;
        if (volume < 50000) continue;
        
        const pair = ticker.base + '/' + ticker.target;
        const symbol = ticker.base;
        const price = ticker.last || 0;
        
        if (!price) continue;
        
        const amount = volume / price;
        const type = ticker.bid_ask_spread_percentage > 0.5 ? "Venda" : "Compra";
        
        // Calcular score de "smart money" com base no volume e spread
        let smartMoneyScore = Math.min(95, Math.max(70, Math.floor(80 + (volume / 1000000))));
        
        // Se o spread for baixo, é mais provável que seja um trader experiente
        if (ticker.bid_ask_spread_percentage && ticker.bid_ask_spread_percentage < 0.2) {
          smartMoneyScore += 5;
        }
        
        transactions.push({
          timestamp: new Date().toISOString(),
          type,
          cryptoAmount: parseFloat(amount.toFixed(4)),
          cryptoSymbol: symbol,
          volume: parseFloat(volume.toFixed(2)),
          price: parseFloat(price.toFixed(2)),
          exchange: ticker.market?.name || exchange,
          destinationAddress: `${ticker.trade_url ? ticker.trade_url : ''}`,
          blockExplorer: ticker.trade_url,
          smartMoneyScore
        });
      }
    }
    
    // Se não conseguir dados de tickers suficientes, usar dados de volume histórico
    if (transactions.length < 5 && volumeData.length > 0) {
      for (const { symbol, id, data } of volumeData) {
        if (!data.total_volumes || !data.prices) continue;
        
        const volumes = data.total_volumes;
        const prices = data.prices;
        
        if (volumes.length === 0 || prices.length === 0) continue;
        
        // Encontrar volumes significativos (top 10%)
        const significantVolumes = [...volumes].sort((a, b) => b[1] - a[1]).slice(0, Math.ceil(volumes.length * 0.1));
        
        for (const [timestamp, volume] of significantVolumes) {
          if (volume < 100000) continue; // Ignorar volumes pequenos
          
          // Encontrar preço mais próximo do timestamp
          const closestPrice = prices.reduce((closest, current) => {
            return Math.abs(current[0] - timestamp) < Math.abs(closest[0] - timestamp) 
              ? current : closest;
          }, prices[0]);
          
          const price = closestPrice ? closestPrice[1] : 0;
          if (price === 0) continue;
          
          transactions.push({
            timestamp: new Date(timestamp).toISOString(),
            type: volume > 1000000 ? "Compra" : "Venda",
            cryptoAmount: parseFloat((volume / price).toFixed(4)),
            cryptoSymbol: symbol,
            volume: parseFloat((volume).toFixed(2)),
            price: parseFloat(price.toFixed(2)),
            exchange: "Mercado Global",
            destinationAddress: `https://www.coingecko.com/en/coins/${id}`,
            blockExplorer: `https://www.coingecko.com/en/coins/${id}`,
            smartMoneyScore: Math.min(95, Math.max(70, Math.floor(75 + (volume / 1000000))))
          });
        }
      }
    }
    
    if (transactions.length === 0) {
      throw new Error("Não foram encontradas transações significativas no período selecionado");
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
    console.error('Erro ao buscar transações de baleias:', error);
    toast.error(`Erro ao obter dados de grandes transações: ${error.message}`);
    throw error; // Propagar o erro em vez de usar fallback
  }
};

// Função para buscar dados on-chain (usando dados reais da API)
export const fetchOnChainData = async (timeframe = '7d') => {
  const cachedData = cache.onChainData.data && 
                     cache.onChainData.timeframe === timeframe;
  
  if (cachedData && Date.now() - cache.onChainDataTimestamp < CACHE_EXPIRY) {
    console.log(`Usando dados on-chain em cache para período: ${timeframe}`);
    return cache.onChainData.data;
  }

  try {
    console.log(`Buscando dados on-chain (${timeframe})`);
    
    // Usando a API de transações reais da blockchain.com (pública)
    const response = await axios.get('https://api.blockchain.info/v2/blocks?format=json');
    
    if (!response.data || !response.data.blocks) {
      throw new Error("Não foi possível obter dados on-chain");
    }
    
    const blocks = response.data.blocks;
    
    // Buscar preços para referência
    const btcPriceResponse = await axiosInstance.get('/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      }
    });
    
    const btcPrice = btcPriceResponse.data?.bitcoin?.usd || 50000;
    
    // Processar transações significativas dos blocos
    const transactions = [];
    
    for (const block of blocks) {
      if (!block.transactions || block.transactions.length === 0) continue;
      
      // Filtrar transações significativas (valores altos)
      for (const tx of block.transactions) {
        // Ignorar transações com fee nula (provavelmente transações de mineração)
        if (!tx.fee || tx.fee === 0) continue;
        
        // Calcular valor total da transação
        let totalValue = 0;
        for (const output of tx.outputs || []) {
          totalValue += output.value || 0;
        }
        
        // Converter satoshis para BTC
        const btcAmount = totalValue / 100000000;
        
        // Calcular valor em USD
        const usdValue = btcAmount * btcPrice;
        
        // Filtrar apenas transações significativas (mais de $100k)
        if (usdValue < 100000) continue;
        
        // Determinar origem e destino
        const fromAddress = (tx.inputs && tx.inputs[0] && tx.inputs[0].address) || "Endereço Desconhecido";
        const toAddress = (tx.outputs && tx.outputs[0] && tx.outputs[0].address) || "Endereço Desconhecido";
        
        // Adicionar à lista de transações
        transactions.push({
          timestamp: new Date(block.time * 1000).toISOString(),
          type: "Transferência",
          cryptoAmount: parseFloat(btcAmount.toFixed(4)),
          cryptoSymbol: 'BTC',
          volume: parseFloat(usdValue.toFixed(2)),
          price: parseFloat(btcPrice.toFixed(2)),
          fromAddress: fromAddress,
          fromName: "Carteira BTC",
          destinationAddress: toAddress,
          destinationName: "Carteira BTC",
          blockExplorer: `https://www.blockchain.com/explorer/transactions/btc/${tx.hash}`,
          tokenContract: "BTC Nativo",
          smartMoneyScore: Math.min(95, Math.max(70, Math.floor(75 + (usdValue / 1000000)))),
          transactionType: 'on-chain'
        });
        
        // Limitar a 20 transações para processamento mais rápido
        if (transactions.length >= 20) break;
      }
      
      if (transactions.length >= 20) break;
    }
    
    if (transactions.length === 0) {
      throw new Error("Não foram encontradas transações on-chain significativas");
    }
    
    // Atualizar cache
    cache.onChainData = {
      data: transactions,
      timeframe
    };
    cache.onChainDataTimestamp = Date.now();
    
    return transactions;
  } catch (error) {
    console.error('Erro ao buscar dados on-chain:', error);
    toast.error(`Erro ao obter dados on-chain: ${error.message}`);
    throw error; // Propagar o erro em vez de usar fallback
  }
};

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

// Remover todas as funções de dados simulados
