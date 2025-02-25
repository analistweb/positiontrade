
import { axiosInstance, handleApiError } from '../config/api';
import { retryWithBackoff, handleAPIResponse } from './errorHandlingService';
import { toast } from "sonner";

let worker = null;

try {
  worker = new Worker('/marketAnalysis.worker.js');
} catch (error) {
  console.error('Error initializing Web Worker:', error);
}

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  try {
    console.log(`Fetching market data for ${coin} over ${days} days`);
    
    const response = await retryWithBackoff(
      async () => axiosInstance.get(`/coins/${coin}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        }
      }),
      `buscar dados de mercado para ${coin}`
    );

    const data = handleAPIResponse(response, 'dados de mercado');

    if (worker) {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Worker timeout'));
        }, 10000);

        worker.onmessage = function(e) {
          clearTimeout(timeoutId);
          const { type, data: workerData } = e.data;
          
          switch (type) {
            case 'RSI_RESULT':
              data.rsi = workerData;
              break;
            case 'PATTERNS_RESULT':
              data.patterns = workerData;
              break;
            case 'ERROR':
              console.error('Worker error:', workerData);
              break;
          }
          
          resolve(data);
        };

        worker.onerror = function(error) {
          clearTimeout(timeoutId);
          console.error('Worker error:', error);
          resolve(data);
        };

        worker.postMessage({
          type: 'calculateRSI',
          data: { prices: data.prices.map(p => p[1]) }
        });

        worker.postMessage({
          type: 'calculatePatterns',
          data: {
            prices: data.prices.map(p => p[1]),
            volumes: data.total_volumes.map(v => v[1])
          }
        });
      });
    }

    return data;
  } catch (error) {
    const handledError = handleApiError(error, 'buscar dados de mercado');
    toast.error(handledError.message);
    throw handledError;
  }
};

export const fetchTopCoins = async () => {
  try {
    console.log('Fetching top coins data');
    
    const response = await retryWithBackoff(
      async () => axiosInstance.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false,
          price_change_percentage: '24h'
        }
      }),
      'buscar top moedas'
    );

    return handleAPIResponse(response, 'top moedas');
  } catch (error) {
    const handledError = handleApiError(error, 'buscar top moedas');
    toast.error(handledError.message);
    throw handledError;
  }
};
