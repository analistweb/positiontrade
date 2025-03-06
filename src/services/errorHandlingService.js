
import { toast } from "sonner";
import { updateConnectionStatus } from '../utils/connectionStatus';

const MAX_RETRIES = 2; // Diminuído para 2 para falhar mais rápido
const INITIAL_RETRY_DELAY = 1000; // 1 segundo

export class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

export const retryWithBackoff = async (operation, context = '') => {
  let lastError;
  let delay = INITIAL_RETRY_DELAY;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Se já estamos usando dados em cache, não precisa repetir
      if (error.cached) {
        console.log(`Usando dados em cache para ${context}`);
        return error;
      }
      
      console.error(`Tentativa ${attempt} falhou para: ${context}`, error);

      if (error?.response?.status === 429) {
        toast.error("Limite de requisições atingido. Aguardando...");
        delay = delay * 2; // Backoff exponencial
      } else if (error?.response?.status === 404) {
        throw new APIError('Recurso não encontrado', 404, 'NOT_FOUND');
      } else if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK') {
        updateConnectionStatus(false);
        
        if (attempt === MAX_RETRIES) {
          toast.error("Problemas de conexão. Usando dados locais.");
        }
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Atualiza o status de conexão para offline após tentativas falharem
  updateConnectionStatus(false);
  
  throw lastError || new Error(`Falha após ${MAX_RETRIES} tentativas`);
};

export const handleAPIResponse = (response, context) => {
  if (!response.data) {
    throw new APIError(`Dados inválidos recebidos: ${context}`, 400, 'INVALID_DATA');
  }
  return response.data;
};

// Nova função auxiliar para detectar erros de rede
export const isNetworkError = (error) => {
  return (
    error?.code === 'ECONNABORTED' || 
    error?.code === 'ERR_NETWORK' || 
    error?.message === 'Network Error' ||
    error?.message?.includes('timeout')
  );
};
