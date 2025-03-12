
import { toast } from "sonner";
import { logError } from '../utils/logger';
import { updateConnectionStatus } from '../utils/connectionStatus';
import { getValidCache, setCacheData } from './apiCache';

export const setupInterceptors = (axiosInstance, instanceName) => {
  // Request interceptor for cache checking
  axiosInstance.interceptors.request.use(
    async (config) => {
      try {
        // Check cache before making request
        const cacheKey = `${instanceName}-${config.url}?${JSON.stringify(config.params)}`;
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

  // Response interceptor for caching and error handling
  axiosInstance.interceptors.response.use(
    (response) => {
      try {
        // Cache successful responses
        const cacheKey = `${instanceName}-${response.config.url}?${JSON.stringify(response.config.params)}`;
        setCacheData(cacheKey, response.data);
        
        // If we got a response, update connection status to online
        updateConnectionStatus(true);
      } catch (error) {
        console.error('Error caching response:', error);
      }
      return response;
    },
    async (error) => {
      // Log error for debugging
      logError(error, { 
        context: `${instanceName} API request`, 
        url: error?.config?.url,
        params: error?.config?.params 
      });

      // Handle cached responses differently
      if (error.__CACHED) {
        return Promise.resolve({
          ...error.response,
          cached: true
        });
      }

      // Get cache key for recovery attempt
      const cacheKey = error.config ? 
        `${instanceName}-${error.config.url}?${JSON.stringify(error.config.params)}` : 
        null;
      
      // Try to get cached data
      const cachedData = cacheKey ? 
        getValidCache(cacheKey) : 
        null;

      // Rate limiting - use cache if available
      if (error.response?.status === 429) {
        toast.error("Limite de requisições atingido", {
          description: "Usando dados em cache temporariamente"
        });
        
        if (cachedData) {
          console.log('Using cached data due to rate limiting');
          return Promise.resolve({ 
            data: cachedData, 
            headers: error.config.headers, 
            cached: true 
          });
        }
      }

      // Network errors - try to use cache
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        // Update connection status to offline
        updateConnectionStatus(false);
        
        if (!cacheKey) {
          toast.error("Erro de conexão", {
            description: "Verifique sua internet e tente novamente"
          });
          return Promise.reject(error);
        }
        
        // Try to get cached data
        if (cachedData) {
          console.log('Using cached data due to network error');
          return Promise.resolve({ 
            data: cachedData, 
            headers: error.config.headers, 
            cached: true,
            cacheAge: Date.now() - cachedData.timestamp 
          });
        }
        
        toast.error("Sem conexão", {
          description: "Tentando usar dados locais de contingência"
        });
      }

      // If we couldn't handle the error, throw it
      return Promise.reject(error);
    }
  );
};
