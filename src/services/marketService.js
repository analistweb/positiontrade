
// This file now acts as the public API for the market services
// It re-exports specific functions from more focused modules

import { fetchMarketData, fetchTopCoins } from './market/marketDataService';
import { clearCache, getCacheStatus } from './cache/cacheService';

// Re-export functions for backward compatibility
export {
  fetchMarketData,
  fetchTopCoins,
  clearCache as clearMarketCache,
  getCacheStatus
};
