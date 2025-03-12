
import { logError } from '../utils/logger';

// Standard error handler for API requests
export const handleApiError = (error, context) => {
  // Log error for debugging
  logError(error, { 
    context: context || 'API request', 
    url: error?.config?.url,
    params: error?.config?.params 
  });

  // Determine appropriate error message
  let errorMessage;
  
  if (error?.response?.status === 429) {
    errorMessage = "Limite de requisições atingido";
  } else if (error?.response?.status === 404) {
    errorMessage = "Recurso não encontrado";
  } else if (isNetworkError(error)) {
    errorMessage = "Erro de conexão. Verifique sua internet";
  } else {
    errorMessage = error?.response?.data?.error || 
                   error?.message || 
                   "Erro desconhecido ao acessar API";
  }

  return {
    message: errorMessage,
    status: error?.response?.status || 0,
    isNetworkError: isNetworkError(error),
    original: error
  };
};

// Helper function to detect network errors
export const isNetworkError = (error) => {
  return (
    error?.code === 'ECONNABORTED' || 
    error?.code === 'ERR_NETWORK' || 
    error?.message === 'Network Error' ||
    error?.message?.includes('timeout')
  );
};
