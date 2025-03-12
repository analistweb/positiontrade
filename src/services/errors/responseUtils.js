
import { APIError } from './APIError';

export const handleAPIResponse = (response, context) => {
  if (!response.data) {
    throw new APIError(`Dados inválidos recebidos: ${context}`, 400, 'INVALID_DATA');
  }
  return response.data;
};
