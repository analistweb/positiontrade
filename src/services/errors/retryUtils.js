
import { toast } from "sonner";
import { updateConnectionStatus } from '../../utils/connectionStatus';

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 1000;

export const retryWithBackoff = async (operation, context = '') => {
  let lastError;
  let delay = INITIAL_RETRY_DELAY;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (error.cached) {
        console.log(`Usando dados em cache para ${context}`);
        return error;
      }
      
      console.error(`Tentativa ${attempt} falhou para: ${context}`, error);

      if (error?.response?.status === 429) {
        toast.error("Limite de requisições atingido. Aguardando...");
        delay = delay * 2;
      } else if (error?.response?.status === 404) {
        throw new APIError('Recurso não encontrado', 404, 'NOT_FOUND');
      } else if (isNetworkError(error)) {
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

  updateConnectionStatus(false);
  throw lastError || new Error(`Falha após ${MAX_RETRIES} tentativas`);
};

export const isNetworkError = (error) => {
  return (
    error?.code === 'ECONNABORTED' || 
    error?.code === 'ERR_NETWORK' || 
    error?.message === 'Network Error' ||
    error?.message?.includes('timeout')
  );
};
