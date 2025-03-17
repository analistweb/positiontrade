
import axios from 'axios';
import { toast } from "sonner";
import { logError } from '../utils/logger';

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const BLOCKCHAIN_API_URL = 'https://api.blockchain.info';

// Cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

// Create axios instance with defaults for CoinGecko
export const axiosInstance = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 20000, // Increased timeout to 20 seconds
  headers: getHeaders()
});

// Create axios instance for blockchain.com API
export const blockchainInstance = axios.create({
  baseURL: BLOCKCHAIN_API_URL,
  timeout: 20000,
  headers: getHeaders()
});

// Response interceptor for caching
axiosInstance.interceptors.response.use(
  (response) => {
    try {
      // Cache successful responses
      const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params)}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error caching response:', error);
    }
    return response;
  },
  async (error) => {
    // Log error for debugging
    logError(error, { 
      context: 'API request', 
      url: error?.config?.url,
      params: error?.config?.params 
    });

    if (error.response?.status === 429) {
      toast.error("Limite de requisições atingido. Tentando novamente em breve...");
      
      // Try to get cached data
      const cacheKey = `${error.config.url}?${JSON.stringify(error.config.params)}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        console.log('Using cached data due to rate limiting');
        return Promise.resolve({ data: cachedData.data });
      }
    }

    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      toast.error("Erro de conexão. Verifique sua internet.", {
        description: "Tentando recuperar dados do cache..."
      });
      
      // Try to get cached data for network errors
      try {
        const cacheKey = `${error.config.url}?${JSON.stringify(error.config.params)}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
          console.log('Using cached data due to network error');
          return Promise.resolve({ data: cachedData.data });
        }
      } catch (err) {
        console.error('Error retrieving cache:', err);
      }
    }

    // If we couldn't handle the error, throw it
    return Promise.reject(error);
  }
);

// Request interceptor for cache
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Check cache before making request
      const cacheKey = `${config.url}?${JSON.stringify(config.params)}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        // Return cached data and prevent request
        return Promise.reject({
          config,
          response: { data: cachedData.data },
          __CACHED: true
        });
      }
    } catch (error) {
      console.error('Error checking cache:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Apply the same cache handling to blockchain instance
blockchainInstance.interceptors.response.use(
  (response) => {
    try {
      const cacheKey = `blockchain-${response.config.url}?${JSON.stringify(response.config.params)}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error caching blockchain response:', error);
    }
    return response;
  },
  async (error) => {
    logError(error, { 
      context: 'Blockchain API request', 
      url: error?.config?.url,
      params: error?.config?.params 
    });
    
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      try {
        const cacheKey = `blockchain-${error.config.url}?${JSON.stringify(error.config.params)}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
          return Promise.resolve({ data: cachedData.data });
        }
      } catch (err) {
        console.error('Error retrieving blockchain cache:', err);
      }
    }
    
    return Promise.reject(error);
  }
);

// Handle cached responses in response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.__CACHED) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

export const clearCache = () => {
  cache.clear();
  toast.success("Cache limpo com sucesso!");
};

export const getCacheSize = () => {
  return cache.size;
};

export const getCacheStatus = () => {
  return Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    isValid: (Date.now() - value.timestamp) < CACHE_DURATION
  }));
};
