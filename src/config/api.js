
// Main API configuration file that re-exports all API-related functionality
import { 
  COINGECKO_API_URL, 
  BLOCKCHAIN_API_URL,
  getHeaders, 
  axiosInstance, 
  blockchainInstance 
} from './apiConfig';

import { 
  clearCache, 
  getCacheSize, 
  getCacheStatus, 
  getValidCache 
} from './apiCache';

// Re-export everything for backward compatibility
export {
  COINGECKO_API_URL,
  BLOCKCHAIN_API_URL,
  getHeaders,
  axiosInstance,
  blockchainInstance,
  clearCache,
  getCacheSize,
  getCacheStatus,
  getValidCache
};

// Re-export additional utilities
export { handleApiError } from './apiErrorHandling';
