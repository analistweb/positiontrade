
import axios from 'axios';
import { toast } from "sonner";
import { logError } from '../utils/logger';
import { updateConnectionStatus } from '../utils/connectionStatus';

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const BLOCKCHAIN_API_URL = 'https://api.blockchain.info';

// Aumentar tempo de cache para reduzir solicitações
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Cache implementation
const cache = new Map();

export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

// Create axios instance with defaults for CoinGecko
export const axiosInstance = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 8000, // 8 segundos
  headers: getHeaders()
});

// Create axios instance for blockchain.com API
export const blockchainInstance = axios.create({
  baseURL: BLOCKCHAIN_API_URL,
  timeout: 8000,
  headers: getHeaders()
});

// Função para verificar se há dados em cache válidos
const getValidCache = (cacheKey) => {
  const cachedData = cache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    console.log('Usando dados em cache:', cacheKey);
    return cachedData.data;
  }
  return null;
};

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
      
      // Se conseguimos obter uma resposta, atualizamos o estado da conexão
      updateConnectionStatus(true);
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

    // Obtém chave de cache para tentar recuperar dados
    const cacheKey = error.config ? `${error.config.url}?${JSON.stringify(error.config.params)}` : null;
    const cachedData = cacheKey ? cache.get(cacheKey) : null;

    if (error.response?.status === 429) {
      toast.error("Limite de requisições atingido", {
        description: "Usando dados em cache temporariamente"
      });
      
      // Try to get cached data
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        console.log('Using cached data due to rate limiting');
        return Promise.resolve({ data: cachedData.data, headers: error.config.headers, cached: true });
      }
    }

    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      // Atualiza o status de conexão para offline
      updateConnectionStatus(false);
      
      if (!cacheKey) {
        toast.error("Erro de conexão", {
          description: "Verifique sua internet e tente novamente"
        });
        return Promise.reject(error);
      }
      
      // Try to get cached data for network errors
      try {
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
          console.log('Using cached data due to network error');
          return Promise.resolve({ 
            data: cachedData.data, 
            headers: error.config.headers, 
            cached: true,
            cacheAge: Date.now() - cachedData.timestamp 
          });
        } else if (cachedData) {
          // Usa dados expirados em caso de emergência, mas avisa o usuário
          console.log('Using expired cached data due to network error');
          toast.warning("Usando dados antigos", {
            description: "Os dados podem estar desatualizados devido a problemas de conexão"
          });
          return Promise.resolve({ 
            data: cachedData.data, 
            headers: error.config.headers, 
            cached: true,
            cacheAge: Date.now() - cachedData.timestamp 
          });
        }
      } catch (err) {
        console.error('Error retrieving cache:', err);
      }
      
      toast.error("Sem conexão", {
        description: "Tentando usar dados locais de contingência"
      });
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
      const cachedData = getValidCache(cacheKey);
      
      if (cachedData) {
        // Return cached data and prevent request
        return Promise.reject({
          config,
          response: { data: cachedData },
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
      
      // Se conseguimos obter uma resposta, atualizamos o estado da conexão
      updateConnectionStatus(true);
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
    
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      updateConnectionStatus(false);
      
      try {
        const cacheKey = `blockchain-${error.config.url}?${JSON.stringify(error.config.params)}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
          console.log('Using cached blockchain data due to network error');
          return Promise.resolve({ 
            data: cachedData.data, 
            cached: true 
          });
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
      return Promise.resolve({
        ...error.response,
        cached: true
      });
    }
    return Promise.reject(error);
  }
);

// Similar handling for blockchain instance
blockchainInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.__CACHED) {
      return Promise.resolve({
        ...error.response,
        cached: true
      });
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
