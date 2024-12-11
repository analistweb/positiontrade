export const API_CONFIG = {
  RETRY_COUNT: 3,
  CACHE_TIME: 60000,
  STALE_TIME: 20000,
  REFETCH_INTERVAL: 30000,
};

export const ERROR_MESSAGES = {
  RATE_LIMIT: "Limite de requisições excedido. Tente novamente em alguns minutos.",
  GENERIC_ERROR: "Erro ao carregar dados do mercado. Tente novamente.",
  INVALID_DATA: "Dados inválidos recebidos da API",
  NO_DATA: "Nenhum dado disponível no momento.",
};