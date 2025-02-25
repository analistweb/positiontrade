
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

let worker = null;

try {
  worker = new Worker('/marketAnalysis.worker.js');
} catch (error) {
  console.error('Error initializing Web Worker:', error);
}

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  try {
    console.log(`Fetching market data for ${coin} over ${days} days`);
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coin}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        headers: getHeaders(),
        timeout: 5000
      }
    );

    if (!response.data) {
      throw new Error('Dados não disponíveis');
    }

    if (worker) {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Worker timeout'));
        }, 10000);

        worker.onmessage = function(e) {
          clearTimeout(timeoutId);
          const { type, data } = e.data;
          
          switch (type) {
            case 'RSI_RESULT':
              response.data.rsi = data;
              break;
            case 'PATTERNS_RESULT':
              response.data.patterns = data;
              break;
            case 'ERROR':
              console.error('Worker error:', data);
              break;
          }
          
          resolve(response.data);
        };

        worker.onerror = function(error) {
          clearTimeout(timeoutId);
          console.error('Worker error:', error);
          resolve(response.data);
        };

        worker.postMessage({
          type: 'calculateRSI',
          data: { prices: response.data.prices.map(p => p[1]) }
        });

        worker.postMessage({
          type: 'calculatePatterns',
          data: {
            prices: response.data.prices.map(p => p[1]),
            volumes: response.data.total_volumes.map(v => v[1])
          }
        });
      });
    }

    console.log('Market data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};

export const fetchTopCoins = async () => {
  try {
    console.log('Fetching top coins data');
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false,
          price_change_percentage: '24h'
        },
        headers: getHeaders(),
        timeout: 5000
      }
    );

    if (!response.data) {
      throw new Error('Dados não disponíveis');
    }

    console.log('Top coins fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    throw error;
  }
};
