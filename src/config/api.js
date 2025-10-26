
import axios from 'axios';
import { toast } from "sonner";

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

// Create axios instance with defaults
export const axiosInstance = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 15000, // Increased timeout to 15 seconds
  headers: getHeaders()
});

// Request interceptor for cache checking
axiosInstance.interceptors.request.use(
  async (config) => {
    // Check cache before making request
    const cacheKey = `${config.url}?${JSON.stringify(config.params)}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      // Mark as using cache
      config.__useCache = true;
      config.__cacheData = cachedData.data;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for caching and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // If using cached data, return it
    if (response.config.__useCache) {
      return { ...response, data: response.config.__cacheData };
    }
    
    // Cache successful responses
    const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params)}`;
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    return response;
  },
  async (error) => {
    const cacheKey = `${error.config?.url}?${JSON.stringify(error.config?.params)}`;
    const cachedData = cache.get(cacheKey);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION * 2) {
        toast.error("Limite de requisições atingido. Usando dados em cache...");
        return Promise.resolve({ data: cachedData.data, fromCache: true });
      }
      toast.error("Limite de requisições atingido. Aguarde alguns instantes.");
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION * 2) {
        toast.error("Erro de conexão. Usando dados em cache...");
        return Promise.resolve({ data: cachedData.data, fromCache: true });
      }
      toast.error("Erro de conexão. Verifique sua internet.");
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

export const handleApiError = (error, action = 'processar requisição') => {
  let message = `Falha ao ${action}.`;

  if (error?.response) {
    const status = error.response.status;
    if (status === 429) {
      message += ' Limite de requisições atingido. Tente novamente em instantes.';
    } else if (status >= 500) {
      message += ' Erro no servidor do provedor de dados.';
    }

    const apiMsg = error.response.data?.error || error.response.data?.message;
    if (apiMsg) {
      message += ` ${apiMsg}`;
    }
  } else if (error?.request) {
    message += ' Sem resposta do servidor. Verifique sua conexão.';
  } else if (error?.message) {
    message += ` ${error.message}`;
  }

  const wrapped = new Error(message);
  wrapped.cause = error;
  return wrapped;
};
