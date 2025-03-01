
import { axiosInstance, handleApiError } from '../config/api';
import { retryWithBackoff, handleAPIResponse } from './errorHandlingService';
import { toast } from "sonner";

// Cache simples para armazenar dados temporariamente
const cache = {
  marketData: new Map(),
  topCoins: null,
  topCoinsTimestamp: null,
  whaleTransactions: null,
  whaleTransactionsTimestamp: null,
};

// Tempo de expiração do cache (5 minutos)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Inicializar o Web Worker
let worker = null;

try {
  worker = new Worker('/marketAnalysis.worker.js');
} catch (error) {
  console.error('Error initializing Web Worker:', error);
}

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  // Verificar cache primeiro
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

    // Processar dados pelo worker se disponível
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

      // Salvar em cache
      cache.marketData.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });
      
      return processedData;
    }

    // Se não há worker, armazenar dados básicos
    cache.marketData.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    toast.error(`Erro ao carregar dados: ${error.message}`);
    
    // Verificar se temos algum dado em cache, mesmo expirado
    const expiredCache = cache.marketData.get(cacheKey);
    if (expiredCache) {
      console.log('Usando dados em cache expirados como fallback');
      toast.info('Usando dados offline (pode estar desatualizado)');
      return expiredCache.data;
    }
    
    // Fallback para estrutura de dados vazia
    return {
      prices: [],
      market_caps: [],
      total_volumes: [],
      error: error.message
    };
  }
};

export const fetchTopCoins = async () => {
  // Verificar cache primeiro
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
    
    // Salvar em cache
    cache.topCoins = data;
    cache.topCoinsTimestamp = Date.now();
    
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    toast.error(`Erro ao carregar moedas: ${error.message}`);
    
    // Se temos cache expirado, usar como fallback
    if (cache.topCoins) {
      toast.info('Usando dados offline (pode estar desatualizado)');
      return cache.topCoins;
    }
    
    // Dados de fallback
    return [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 65000, price_change_percentage_24h: 1.5 },
      { id: 'ethereum', name: 'Ethereum', symbol: 'eth', current_price: 3500, price_change_percentage_24h: 2.1 },
      { id: 'tether', name: 'Tether', symbol: 'usdt', current_price: 1, price_change_percentage_24h: 0.01 },
      { id: 'binancecoin', name: 'BNB', symbol: 'bnb', current_price: 570, price_change_percentage_24h: -0.5 }
    ];
  }
};

// Nova função para obter transações de baleias com dados da API
export const fetchWhaleTransactions = async () => {
  // Verificar cache primeiro
  if (cache.whaleTransactions && Date.now() - cache.whaleTransactionsTimestamp < CACHE_EXPIRY) {
    console.log('Usando transações de baleias em cache');
    return cache.whaleTransactions;
  }

  try {
    console.log('Buscando dados para análise de grandes movimentações');
    
    // Obter dados de volume de várias moedas importantes
    const coins = ['bitcoin', 'ethereum', 'tether', 'binancecoin'];
    const volumeDataPromises = coins.map(coin => 
      axiosInstance.get(`/coins/${coin}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: 7,
          interval: 'hourly'
        }
      })
    );
    
    const responses = await Promise.all(volumeDataPromises);
    const volumeData = responses.map((response, index) => ({
      coin: coins[index],
      data: response.data
    }));
    
    // Construir transações sintéticas baseadas em grandes volumes reais
    const mockTransactions = [];
    
    for (const coinData of volumeData) {
      const { coin, data } = coinData;
      const volumes = data.total_volumes;
      const prices = data.prices;
      
      // Obter apenas os maiores volumes (acima de 80% do máximo)
      const maxVolume = Math.max(...volumes.map(v => v[1]));
      const threshold = maxVolume * 0.8;
      
      const significantVolumes = volumes
        .filter(v => v[1] > threshold)
        .slice(0, 3); // Limitar a 3 por moeda
      
      for (const [timestamp, volume] of significantVolumes) {
        // Encontrar o preço mais próximo para este timestamp
        const closestPrice = prices.find(p => Math.abs(p[0] - timestamp) < 3600000);
        const price = closestPrice ? closestPrice[1] : 0;
        
        // Criar "transação de baleia" sintética
        mockTransactions.push({
          timestamp: new Date(timestamp).toISOString(),
          type: Math.random() > 0.5 ? "Compra" : "Venda",
          cryptoAmount: +(volume / price / (coin === 'bitcoin' ? 20 : 1)).toFixed(4),
          cryptoSymbol: coin === 'bitcoin' ? 'BTC' : 
                        coin === 'ethereum' ? 'ETH' : 
                        coin === 'tether' ? 'USDT' : 'BNB',
          volume: volume,
          price: price,
          exchange: ['Binance', 'Coinbase', 'Kraken', 'Bitfinex'][Math.floor(Math.random() * 4)],
          destinationAddress: `0x${Math.random().toString(16).substring(2, 14)}...`,
          smartMoneyScore: Math.floor(Math.random() * 40) + 60 // Scores entre 60-100
        });
      }
    }
    
    // Ordenar por timestamp decrescente (mais recentes primeiro)
    mockTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Salvar em cache
    cache.whaleTransactions = mockTransactions;
    cache.whaleTransactionsTimestamp = Date.now();
    
    return mockTransactions;
  } catch (error) {
    console.error('Error generating whale transactions:', error);
    toast.error(`Erro ao analisar grandes movimentações: ${error.message}`);
    
    // Se temos cache expirado, usar como fallback
    if (cache.whaleTransactions) {
      toast.info('Usando dados offline (pode estar desatualizado)');
      return cache.whaleTransactions;
    }
    
    // Dados de fallback estáticos
    return [
      {
        timestamp: new Date().toISOString(),
        type: "Compra",
        cryptoAmount: 25.4,
        cryptoSymbol: "BTC",
        volume: 1540000,
        price: 64000,
        exchange: "Binance",
        smartMoneyScore: 85
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "Venda",
        cryptoAmount: 432.8,
        cryptoSymbol: "ETH",
        volume: 1220000,
        price: 3500,
        exchange: "Coinbase",
        smartMoneyScore: 78
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: "Compra",
        cryptoAmount: 18.2,
        cryptoSymbol: "BTC",
        volume: 920000,
        price: 62500,
        exchange: "Kraken",
        smartMoneyScore: 92
      }
    ];
  }
};

// Função para limpar o cache (útil para forçar atualização)
export const clearMarketCache = () => {
  cache.marketData.clear();
  cache.topCoins = null;
  cache.topCoinsTimestamp = null;
  cache.whaleTransactions = null;
  cache.whaleTransactionsTimestamp = null;
  console.log('Cache de dados de mercado limpo');
  toast.success('Dados de mercado serão atualizados na próxima consulta');
};

// Obter status do cache para debugging
export const getCacheStatus = () => {
  return {
    marketDataCount: cache.marketData.size,
    topCoinsCache: cache.topCoins ? `${cache.topCoins.length} moedas (${new Date(cache.topCoinsTimestamp).toLocaleTimeString()})` : 'vazio',
    whaleTransactionsCache: cache.whaleTransactions ? `${cache.whaleTransactions.length} transações (${new Date(cache.whaleTransactionsTimestamp).toLocaleTimeString()})` : 'vazio',
  };
};
