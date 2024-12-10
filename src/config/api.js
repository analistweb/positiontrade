export const COINGECKO_API_KEY = 'CG-Qz8DkMGTZxZM4J6dQnQzxPvt';
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-cg-pro-api-key': COINGECKO_API_KEY
});