
import { toast } from "sonner";

const MAX_RETRIES = 3;
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
      console.error(`Tentativa ${attempt} falhou para: ${context}`, error);

      if (error?.response?.status === 429) {
        toast.error("Limite de requisições atingido. Aguardando...");
        delay = delay * 2; // Backoff exponencial
      } else if (error?.response?.status === 404) {
        throw new APIError('Recurso não encontrado', 404, 'NOT_FOUND');
      } else if (error?.code === 'ECONNABORTED') {
        toast.error("Tempo limite excedido. Tentando novamente...");
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  toast.error(`Falha após ${MAX_RETRIES} tentativas: ${lastError.message}`);
  throw lastError;
};

export const handleAPIResponse = (response, context) => {
  if (!response.data) {
    throw new APIError(`Dados inválidos recebidos: ${context}`, 400, 'INVALID_DATA');
  }
  return response.data;
};
