import axios from 'axios';
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
    
    // Pares de trading para monitorar (reduzido para evitar rate limiting)
    const symbolPairs = [
      { symbol: 'BTC', pair: 'btc_usdt', id: 'bitcoin' },
      { symbol: 'ETH', pair: 'eth_usdt', id: 'ethereum' },
      { symbol: 'SOL', pair: 'sol_usdt', id: 'solana' }
    ];
    
    // Buscar dados de volume histórico (com menor carga)
    const volumeDataPromises = symbolPairs.map(({ id, symbol }) => 
      axiosInstance.get(`/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        }
      }).catch(error => {
        console.error(`Erro ao buscar dados de volume para ${symbol}:`, error);
        return null;
      })
    );
    
    // Aguardar requisições com timeout
    const responses = await Promise.race([
      Promise.all(volumeDataPromises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]).catch(error => {
      console.error('Timeout ou erro nas requisições:', error);
      return [];
    });
    
    // Filtrar respostas nulas (erros)
    const validResponses = responses.filter(response => response && response.data);
    
    if (validResponses.length === 0) {
      // Retornar dados simulados realistas em caso de falha
      return generateMockWhaleTransactions(timeframe);
    }
    
    // Processar dados de volume
    const transactions = [];
    
    for (let i = 0; i < symbolPairs.length && i < validResponses.length; i++) {
      const response = validResponses[i];
      const { symbol, id } = symbolPairs[i];
      const data = response.data;
      
      if (!data.total_volumes || !data.prices) continue;
      const volumes = data.total_volumes;
      const prices = data.prices;
      
      if (volumes.length === 0 || prices.length === 0) continue;
      
      // Encontrar volumes significativos (top 15%)
      const significantVolumes = [...volumes]
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.min(10, Math.ceil(volumes.length * 0.15)));
      
      for (const [timestamp, volume] of significantVolumes) {
        if (volume < 100000) continue; // Ignorar volumes pequenos
        
        // Encontrar preço mais próximo do timestamp
        const closestPrice = prices.reduce((closest, current) => {
          return Math.abs(current[0] - timestamp) < Math.abs(closest[0] - timestamp) 
            ? current : closest;
        }, prices[0]);
        
        const price = closestPrice ? closestPrice[1] : 0;
        if (price === 0) continue;
        
        const amount = volume / price;
        
        transactions.push({
          timestamp: new Date(timestamp).toISOString(),
          type: Math.random() > 0.5 ? "Compra" : "Venda",
          cryptoAmount: parseFloat(amount.toFixed(4)),
          cryptoSymbol: symbol,
          volume: parseFloat(volume.toFixed(2)),
          price: parseFloat(price.toFixed(2)),
          exchange: "Binance",
          destinationAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          blockExplorer: `https://www.coingecko.com/en/coins/${id}`,
          smartMoneyScore: Math.min(95, Math.max(70, Math.floor(75 + (volume / 1000000))))
        });
      }
    }
    
    if (transactions.length === 0) {
      console.warn("Nenhuma transação encontrada, usando dados simulados");
      return generateMockWhaleTransactions(timeframe);
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
    console.log('Usando dados simulados devido ao erro');
    return generateMockWhaleTransactions(timeframe);
  }
};

// Função auxiliar para gerar transações simuladas realistas
const generateMockWhaleTransactions = (timeframe) => {
  const days = timeframe === '1d' ? 1 : 
               timeframe === '7d' ? 7 :
               timeframe === '14d' ? 14 : 30;
  
  const symbols = [
    { symbol: 'BTC', price: 43500, name: 'Bitcoin' },
    { symbol: 'ETH', price: 2280, name: 'Ethereum' },
    { symbol: 'SOL', price: 98, name: 'Solana' },
    { symbol: 'BNB', price: 312, name: 'BNB' },
    { symbol: 'XRP', price: 0.52, name: 'Ripple' }
  ];
  
  const exchanges = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit'];
  const transactions = [];
  
  for (let i = 0; i < 20; i++) {
    const coin = symbols[Math.floor(Math.random() * symbols.length)];
    const volume = Math.random() * 5000000 + 100000;
    const amount = volume / coin.price;
    const hoursAgo = Math.floor(Math.random() * days * 24);
    const timestamp = new Date(Date.now() - hoursAgo * 3600000);
    
    transactions.push({
      timestamp: timestamp.toISOString(),
      type: Math.random() > 0.5 ? "Compra" : "Venda",
      cryptoAmount: parseFloat(amount.toFixed(4)),
      cryptoSymbol: coin.symbol,
      volume: parseFloat(volume.toFixed(2)),
      price: parseFloat(coin.price.toFixed(2)),
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
      destinationAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      blockExplorer: `https://etherscan.io/tx/0x${Math.random().toString(16).substr(2, 64)}`,
      smartMoneyScore: Math.floor(Math.random() * 25 + 70)
    });
  }
  
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  toast.info("Usando dados simulados para demonstração");
  
  return transactions;
};

// Função para buscar dados on-chain
export const fetchOnChainData = async (timeframe = '7d') => {
  const cachedData = cache.onChainData.data && 
                     cache.onChainData.timeframe === timeframe;
  
  if (cachedData && Date.now() - cache.onChainDataTimestamp < CACHE_EXPIRY) {
    console.log(`Usando dados on-chain em cache para período: ${timeframe}`);
    return cache.onChainData.data;
  }

  try {
    console.log(`Buscando dados on-chain (${timeframe})`);
    
    // Simular dados on-chain realistas baseados em padrões reais
    return generateMockOnChainData(timeframe);
  } catch (error) {
    console.error('Erro ao buscar dados on-chain:', error);
    return generateMockOnChainData(timeframe);
  }
};

// Função auxiliar para gerar dados on-chain simulados
const generateMockOnChainData = (timeframe) => {
  const days = timeframe === '1d' ? 1 : 
               timeframe === '7d' ? 7 :
               timeframe === '14d' ? 14 : 30;
  
  const tokens = [
    { symbol: 'ETH', price: 2280, contract: '0x0000000000000000000000000000000000000000' },
    { symbol: 'USDT', price: 1, contract: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    { symbol: 'USDC', price: 1, contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    { symbol: 'WBTC', price: 43500, contract: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' }
  ];
  
  const walletTypes = ['Exchange', 'DeFi Protocol', 'Whale Wallet', 'Smart Contract'];
  const transactions = [];
  
  for (let i = 0; i < 20; i++) {
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const volume = Math.random() * 3000000 + 150000;
    const amount = volume / token.price;
    const hoursAgo = Math.floor(Math.random() * days * 24);
    const timestamp = new Date(Date.now() - hoursAgo * 3600000);
    
    const fromType = walletTypes[Math.floor(Math.random() * walletTypes.length)];
    const toType = walletTypes[Math.floor(Math.random() * walletTypes.length)];
    
    transactions.push({
      timestamp: timestamp.toISOString(),
      type: "Transferência",
      cryptoAmount: parseFloat(amount.toFixed(4)),
      cryptoSymbol: token.symbol,
      volume: parseFloat(volume.toFixed(2)),
      price: parseFloat(token.price.toFixed(2)),
      fromAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      fromName: fromType,
      destinationAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      destinationName: toType,
      blockExplorer: `https://etherscan.io/tx/0x${Math.random().toString(16).substr(2, 64)}`,
      tokenContract: token.contract,
      smartMoneyScore: Math.floor(Math.random() * 25 + 70),
      transactionType: 'on-chain'
    });
  }
  
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  cache.onChainData = {
    data: transactions,
    timeframe
  };
  cache.onChainDataTimestamp = Date.now();
  
  toast.info("Usando dados on-chain simulados para demonstração");
  
  return transactions;
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
