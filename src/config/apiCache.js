
import { toast } from "sonner";

// Cache duration (30 minutes)
export const CACHE_DURATION = 30 * 60 * 1000;

// Cache implementation
const cache = new Map();

// Check for valid cache data
export const getValidCache = (cacheKey) => {
  const cachedData = cache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    console.log('Usando dados em cache:', cacheKey);
    return cachedData.data;
  }
  return null;
};

// Set cache data
export const setCacheData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Clear all cache
export const clearCache = () => {
  cache.clear();
  toast.success("Cache limpo com sucesso!");
};

// Get cache size
export const getCacheSize = () => {
  return cache.size;
};

// Get cache status
export const getCacheStatus = () => {
  return Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    isValid: (Date.now() - value.timestamp) < CACHE_DURATION
  }));
};
