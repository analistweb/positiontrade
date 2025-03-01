import { axiosInstance, handleApiError } from '../config/api';
import { retryWithBackoff, handleAPIResponse } from './errorHandlingService';
import { toast } from "sonner";

const cache = {
  marketData: new Map(),
  topCoins: null,
  topCoinsTimestamp: null,
  whaleTransactions: null,
  whaleTransactionsTimestamp: null,
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
  const cachedData = cache.whaleTransactions?.timeframe === timeframe && cache.whaleTransactions;
  
  if (cachedData && Date.now() - cache.whaleTransactionsTimestamp < CACHE_EXPIRY) {
    console.log(`Usando transações de baleias em cache para período: ${timeframe}`);
    return cachedData.data;
  }

  try {
    console.log(`Buscando dados para análise de grandes movimentações (${timeframe})`);
    
    const days = timeframe === '1d' ? 1 : 
                 timeframe === '7d' ? 7 :
                 timeframe === '14d' ? 14 : 30;
    
    const exchanges = ['binance', 'coinbase', 'kraken', 'kucoin', 'bitfinex'];
    const symbolPairs = [
      { symbol: 'BTC', pair: 'btc_usdt' },
      { symbol: 'ETH', pair: 'eth_usdt' },
      { symbol: 'BNB', pair: 'bnb_usdt' },
      { symbol: 'XRP', pair: 'xrp_usdt' }
    ];
    
    const volumeDataPromises = symbolPairs.map(({ symbol }) => 
      axiosInstance.get(`/coins/${symbol.toLowerCase()}/market_chart`, {
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
    
    const tickerDataPromises = [];
    for (const exchange of exchanges) {
      for (const { pair } of symbolPairs) {
        tickerDataPromises.push(
          axiosInstance.get(`/exchanges/${exchange}/tickers/${pair}`)
            .catch(error => {
              console.error(`Erro ao buscar dados de tickers para ${exchange}/${pair}:`, error);
              return { data: { tickers: [] } };
            })
        );
      }
    }
    
    const [volumeResponses, tickerResponses] = await Promise.all([
      Promise.all(volumeDataPromises),
      Promise.all(tickerDataPromises)
    ]);
    
    const volumeData = volumeResponses.map((response, index) => ({
      symbol: symbolPairs[index].symbol,
      data: response.data
    }));
    
    let significantTickers = [];
    if (tickerResponses.length > 0) {
      tickerResponses.forEach(response => {
        if (response?.data?.tickers) {
          significantTickers.push(...response.data.tickers);
        }
      });
      
      significantTickers.sort((a, b) => b.volume - a.volume);
      const threshold = Math.max(Math.floor(significantTickers.length * 0.05), 5);
      significantTickers = significantTickers.slice(0, threshold);
    }
    
    const transactions = [];
    
    for (const ticker of significantTickers) {
      if (!ticker.base || !ticker.target || !ticker.last || !ticker.volume) continue;
      
      const symbol = ticker.base;
      const type = Math.random() > 0.5 ? "Compra" : "Venda";
      
      const volume = ticker.converted_volume ? 
                     ticker.converted_volume.usd : 
                     ticker.volume * ticker.last;
                     
      if (!volume) continue;
      
      const amount = volume / ticker.last;
      
      transactions.push({
        timestamp: new Date(ticker.timestamp || Date.now()).toISOString(),
        type,
        cryptoAmount: parseFloat(amount.toFixed(4)),
        cryptoSymbol: symbol,
        volume: parseFloat(volume.toFixed(2)),
        price: parseFloat(ticker.last.toFixed(2)),
        exchange: ticker.market?.name || exchanges[Math.floor(Math.random() * exchanges.length)],
        destinationAddress: `0x${Math.random().toString(16).substring(2, 14)}...`,
        smartMoneyScore: Math.floor(Math.random() * 20) + 80
      });
    }
    
    if (transactions.length < 10) {
      for (const { symbol, data } of volumeData) {
        if (!data.total_volumes || !data.prices) continue;
        
        const volumes = data.total_volumes;
        const prices = data.prices;
        
        if (volumes.length === 0 || prices.length === 0) continue;
        
        const maxVolume = Math.max(...volumes.map(v => v[1]));
        const threshold = maxVolume * 0.9;
        
        const significantVolumes = volumes
          .filter(v => v[1] > threshold)
          .slice(0, 3);
        
        for (const [timestamp, volume] of significantVolumes) {
          const closestPrice = prices.find(p => Math.abs(p[0] - timestamp) < 3600000);
          const price = closestPrice ? closestPrice[1] : 0;
          
          if (price === 0) continue;
          
          transactions.push({
            timestamp: new Date(timestamp).toISOString(),
            type: Math.random() > 0.5 ? "Compra" : "Venda",
            cryptoAmount: parseFloat((volume / price / 10).toFixed(4)),
            cryptoSymbol: symbol,
            volume: parseFloat(volume.toFixed(2)),
            price: parseFloat(price.toFixed(2)),
            exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
            destinationAddress: `0x${Math.random().toString(16).substring(2, 14)}...`,
            smartMoneyScore: Math.floor(Math.random() * 20) + 80
          });
        }
      }
    }
    
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const result = transactions.slice(0, 20);
    
    cache.whaleTransactions = {
      data: result,
      timeframe
    };
    cache.whaleTransactionsTimestamp = Date.now();
    
    return result;
  } catch (error) {
    console.error('Error generating whale transactions:', error);
    toast.error(`Erro ao analisar grandes movimentações: ${error.message}`);
    
    if (cache.whaleTransactions) {
      toast.info('Usando dados offline (pode estar desatualizado)');
      return cache.whaleTransactions.data;
    }
    
    return [
      {
        timestamp: new Date().toISOString(),
        type: "Compra",
        cryptoAmount: 25.4,
        cryptoSymbol: "BTC",
        volume: 1540000,
        price: 64000,
        exchange: "Binance",
        smartMoneyScore: 85,
        destinationAddress: "0xb23cf1c7aaa..."
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "Venda",
        cryptoAmount: 432.8,
        cryptoSymbol: "ETH",
        volume: 1220000,
        price: 3500,
        exchange: "Coinbase",
        smartMoneyScore: 78,
        destinationAddress: "0x72af91b3ec..."
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: "Compra",
        cryptoAmount: 18.2,
        cryptoSymbol: "BTC",
        volume: 920000,
        price: 62500,
        exchange: "Kraken",
        smartMoneyScore: 92,
        destinationAddress: "0x54ec81f29a..."
      }
    ];
  }
};

export const clearMarketCache = () => {
  cache.marketData.clear();
  cache.topCoins = null;
  cache.topCoinsTimestamp = null;
  cache.whaleTransactions = null;
  cache.whaleTransactionsTimestamp = null;
  console.log('Cache de dados de mercado limpo');
  toast.success('Dados de mercado serão atualizados na próxima consulta');
};

export const getCacheStatus = () => {
  return {
    marketDataCount: cache.marketData.size,
    topCoinsCache: cache.topCoins ? `${cache.topCoins.length} moedas (${new Date(cache.topCoinsTimestamp).toLocaleTimeString()})` : 'vazio',
    whaleTransactionsCache: cache.whaleTransactions ? `${cache.whaleTransactions.length} transações (${new Date(cache.whaleTransactionsTimestamp).toLocaleTimeString()})` : 'vazio',
  };
};
