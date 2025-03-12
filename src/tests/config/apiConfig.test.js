
import { describe, test, expect, beforeEach } from 'vitest';
import { 
  COINGECKO_API_URL, 
  BLOCKCHAIN_API_URL, 
  getHeaders,
  axiosInstance,
  blockchainInstance 
} from '../../config/apiConfig';

describe('API Configuration', () => {
  test('API URLs are defined correctly', () => {
    expect(COINGECKO_API_URL).toBe('https://api.coingecko.com/api/v3');
    expect(BLOCKCHAIN_API_URL).toBe('https://api.blockchain.info');
  });

  test('getHeaders returns correct headers', () => {
    const headers = getHeaders();
    expect(headers).toEqual({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  });

  test('axiosInstance is configured correctly', () => {
    expect(axiosInstance.defaults.baseURL).toBe(COINGECKO_API_URL);
    expect(axiosInstance.defaults.timeout).toBe(8000);
    expect(axiosInstance.defaults.headers).toMatchObject(getHeaders());
  });

  test('blockchainInstance is configured correctly', () => {
    expect(blockchainInstance.defaults.baseURL).toBe(BLOCKCHAIN_API_URL);
    expect(blockchainInstance.defaults.timeout).toBe(8000);
    expect(blockchainInstance.defaults.headers).toMatchObject(getHeaders());
  });
});
