export const COINGECKO_API_KEY = 'CG-WXzEmmfvppEojNHNtKc5Ee86';
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-cg-pro-api-key': COINGECKO_API_KEY
});

export const API_CONFIG = {
  REFETCH_INTERVAL: 30000,
  RETRY_COUNT: 3,
  STALE_TIME: 10000,
  CACHE_TIME: 60000
};