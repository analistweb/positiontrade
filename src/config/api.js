
import axios from 'axios';
import { retryWithBackoff, handleAPIResponse } from '../services/errorHandlingService';

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

const axiosInstance = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 10000,
  headers: getHeaders()
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('Erro da API:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('Erro de rede:', error.request);
    } else {
      console.error('Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

export { axiosInstance };

export const handleApiError = (error, context) => {
  let message = 'Erro desconhecido';
  let status = 500;

  if (error?.response) {
    status = error.response.status;
    switch (status) {
      case 429:
        message = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
        break;
      case 404:
        message = 'Dados não encontrados.';
        break;
      case 403:
        message = 'Acesso não autorizado.';
        break;
      default:
        message = error.response.data?.error || `Erro ao ${context}`;
    }
  } else if (error?.code === 'ECONNABORTED') {
    message = 'Tempo de requisição excedido. Verifique sua conexão.';
    status = 408;
  } else if (error?.message) {
    message = error.message;
  }

  return {
    message,
    status,
    originalError: error
  };
};
