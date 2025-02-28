
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
          console.warn('Worker timeout, resolving with basic data');
          resolve(data);
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
          resolve(data); // Fallback to basic data
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
    console.error('Error fetching market data:', error);
    toast.error(`Erro ao carregar dados: ${error.message}`);
    
    // Fallback to empty data structure
    return {
      prices: [],
      market_caps: [],
      total_volumes: [],
      error: error.message
    };
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
    console.error('Error fetching top coins:', error);
    toast.error(`Erro ao carregar moedas: ${error.message}`);
    
    // Return fallback data
    return [
      { id: 'bitcoin', name: 'Bitcoin' },
      { id: 'ethereum', name: 'Ethereum' },
      { id: 'tether', name: 'Tether' },
      { id: 'binancecoin', name: 'BNB' }
    ];
  }
};
