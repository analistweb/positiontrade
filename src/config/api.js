import axios from 'axios';

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

export const handleApiError = (error, context) => {
  console.error(`Erro ao ${context}:`, error);
  
  if (error.code === 'ECONNABORTED') {
    return new Error('Tempo limite de requisição excedido. Por favor, tente novamente.');
  }
  
  if (error.response) {
    if (error.response.status === 429) {
      return new Error('Limite de requisições atingido. Por favor, aguarde alguns minutos.');
    }
    if (error.response.status === 403) {
      return new Error('Acesso não autorizado. Verifique sua chave de API.');
    }
    return new Error(`Erro ${error.response.status}: ${error.response.data?.error || 'Erro desconhecido'}`);
  }
  
  if (error.request) {
    return new Error('Erro de conexão. Verifique sua internet ou tente novamente mais tarde.');
  }
  
  return new Error(error.message || 'Erro desconhecido');
};

export const MOCK_DATA = {
  bitcoin: {
    prices: Array.from({ length: 30 }, (_, i) => [
      Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      40000 + Math.random() * 5000
    ]),
    market_caps: Array.from({ length: 30 }, (_, i) => [
      Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      800000000000 + Math.random() * 50000000000
    ]),
    total_volumes: Array.from({ length: 30 }, (_, i) => [
      Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      30000000000 + Math.random() * 5000000000
    ])
  }
};

// Configuração do axios com retry e cache simplificado
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

axios.interceptors.request.use(async (config) => {
  const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
  const cachedResponse = cache.get(cacheKey);
  
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
    console.log(`Cache hit for ${cacheKey}`);
    return Promise.reject({
      config,
      response: cachedResponse.data,
      __CACHE_HIT__: true
    });
  }
  
  return config;
});

axios.interceptors.response.use(
  (response) => {
    const config = response.config;
    const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
    
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: response
    });
    
    return response;
  },
  (error) => {
    if (error.__CACHE_HIT__) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

export default axios;