
import { describe, test, expect } from 'vitest';
import { handleApiError, isNetworkError } from '../../config/apiErrorHandling';

describe('API Error Handling', () => {
  test('handleApiError handles rate limiting errors', () => {
    const error = {
      response: { status: 429 }
    };
    const result = handleApiError(error);
    expect(result.message).toBe('Limite de requisições atingido');
    expect(result.status).toBe(429);
  });

  test('handleApiError handles 404 errors', () => {
    const error = {
      response: { status: 404 }
    };
    const result = handleApiError(error);
    expect(result.message).toBe('Recurso não encontrado');
    expect(result.status).toBe(404);
  });

  test('handleApiError handles network errors', () => {
    const error = {
      code: 'ERR_NETWORK',
      message: 'Network Error'
    };
    const result = handleApiError(error);
    expect(result.message).toBe('Erro de conexão. Verifique sua internet');
    expect(result.isNetworkError).toBe(true);
  });

  test('isNetworkError correctly identifies network errors', () => {
    expect(isNetworkError({ code: 'ECONNABORTED' })).toBe(true);
    expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isNetworkError({ message: 'Network Error' })).toBe(true);
    expect(isNetworkError({ message: 'timeout of 1000ms exceeded' })).toBe(true);
    expect(isNetworkError({ status: 404 })).toBe(false);
  });
});
