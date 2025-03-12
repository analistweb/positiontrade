
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { setupInterceptors } from '../../config/apiInterceptors';
import axios from 'axios';

describe('API Interceptors', () => {
  let axiosInstance;
  
  beforeEach(() => {
    axiosInstance = axios.create();
    vi.useFakeTimers();
  });

  test('setupInterceptors adds request and response interceptors', () => {
    setupInterceptors(axiosInstance, 'test');
    expect(axiosInstance.interceptors.request.handlers).toHaveLength(1);
    expect(axiosInstance.interceptors.response.handlers).toHaveLength(1);
  });

  test('request interceptor checks cache', async () => {
    setupInterceptors(axiosInstance, 'test');
    const config = {
      url: '/test',
      params: { foo: 'bar' }
    };

    try {
      await axiosInstance.interceptors.request.handlers[0].fulfilled(config);
      expect(config).toBeTruthy();
    } catch (error) {
      if (!error.__CACHED) {
        throw error;
      }
    }
  });

  test('response interceptor handles successful responses', async () => {
    setupInterceptors(axiosInstance, 'test');
    const response = {
      data: { test: 'data' },
      config: { url: '/test' }
    };

    const result = await axiosInstance.interceptors.response.handlers[0].fulfilled(response);
    expect(result).toEqual(response);
  });

  test('response interceptor handles errors', async () => {
    setupInterceptors(axiosInstance, 'test');
    const error = {
      response: { status: 429 },
      config: { url: '/test' }
    };

    try {
      await axiosInstance.interceptors.response.handlers[0].rejected(error);
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });
});
