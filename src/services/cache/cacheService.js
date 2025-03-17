
import { toast } from "sonner";

// Cache implementation
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

// Default cache expiry (5 minutes)
export const CACHE_EXPIRY = 5 * 60 * 1000;

export const getMarketDataCache = (key) => {
  const cachedData = cache.marketData.get(key);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`Using cached data for ${key}`);
    return cachedData.data;
  }
  return null;
};

export const setMarketDataCache = (key, data) => {
  cache.marketData.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const getTopCoinsCache = () => {
  if (cache.topCoins && Date.now() - cache.topCoinsTimestamp < CACHE_EXPIRY) {
    console.log('Using cached top coins data');
    return cache.topCoins;
  }
  return null;
};

export const setTopCoinsCache = (data) => {
  cache.topCoins = data;
  cache.topCoinsTimestamp = Date.now();
};

export const getWhaleTransactionsCache = (timeframe, dataSource) => {
  const cachedData = cache.whaleTransactions.data && 
                     cache.whaleTransactions.timeframe === timeframe &&
                     cache.whaleTransactions.dataSource === dataSource;
  
  if (cachedData && Date.now() - cache.whaleTransactionsTimestamp < CACHE_EXPIRY) {
    console.log(`Using cached whale transactions for period: ${timeframe}`);
    return cache.whaleTransactions.data;
  }
  return null;
};

export const setWhaleTransactionsCache = (data, timeframe, dataSource) => {
  cache.whaleTransactions = {
    data,
    timeframe,
    dataSource
  };
  cache.whaleTransactionsTimestamp = Date.now();
};

export const getOnChainDataCache = (timeframe) => {
  const cachedData = cache.onChainData.data && 
                     cache.onChainData.timeframe === timeframe;
  
  if (cachedData && Date.now() - cache.onChainDataTimestamp < CACHE_EXPIRY) {
    console.log(`Using cached on-chain data for period: ${timeframe}`);
    return cache.onChainData.data;
  }
  return null;
};

export const setOnChainDataCache = (data, timeframe) => {
  cache.onChainData = {
    data,
    timeframe
  };
  cache.onChainDataTimestamp = Date.now();
};

export const clearCache = () => {
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
  console.log('Market data cache cleared');
  toast.success('Data will be updated on next query');
};

export const getCacheStatus = () => {
  return {
    marketDataCount: cache.marketData.size,
    topCoinsCache: cache.topCoins ? `${cache.topCoins.length} coins (${new Date(cache.topCoinsTimestamp).toLocaleTimeString()})` : 'empty',
    whaleTransactionsCache: cache.whaleTransactions.data 
      ? `${cache.whaleTransactions.data.length} transactions (${new Date(cache.whaleTransactionsTimestamp).toLocaleTimeString()})` 
      : 'empty',
    onChainDataCache: cache.onChainData.data
      ? `${cache.onChainData.data.length} transactions (${new Date(cache.onChainDataTimestamp).toLocaleTimeString()})`
      : 'empty'
  };
};
