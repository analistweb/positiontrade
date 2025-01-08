export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

export const handleApiError = (error, context) => {
  console.error(`Erro ao ${context}:`, error);
  
  if (error.response) {
    // Erro com resposta do servidor
    if (error.response.status === 429) {
      return new Error('Limite de requisições atingido. Por favor, aguarde alguns minutos.');
    }
    return new Error(`Erro ${error.response.status}: ${error.response.data?.error || 'Erro desconhecido'}`);
  }
  
  if (error.request) {
    // Erro de rede/sem resposta
    return new Error('Erro de conexão. Verifique sua internet ou tente novamente mais tarde.');
  }
  
  // Outros erros
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