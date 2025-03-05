
import { toast } from "sonner";

// Cache implementation
const cache = {
  marketData: new Map(),
  topCoins: null,
  topCoinsTimestamp: null,
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

export const clearCache = () => {
  cache.marketData.clear();
  cache.topCoins = null;
  cache.topCoinsTimestamp = null;
  console.log('Market data cache cleared');
  toast.success('Data will be updated on next query');
};

export const getCacheStatus = () => {
  return {
    marketDataCount: cache.marketData.size,
    topCoinsCache: cache.topCoins ? `${cache.topCoins.length} coins (${new Date(cache.topCoinsTimestamp).toLocaleTimeString()})` : 'empty',
  };
};
