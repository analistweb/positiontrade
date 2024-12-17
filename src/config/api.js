export const COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const COINGECKO_PRO_URL = 'https://pro-api.coingecko.com/api/v3';

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-cg-pro-api-key': COINGECKO_API_KEY
});

export const handleApiError = (error, context) => {
  console.error(`Erro ao buscar ${context}:`, error);
  const message = error.response?.data?.error || error.message;
  throw new Error(`Falha ao carregar ${context}: ${message}`);
};