
import { axiosInstance } from '../../config/api';
import { toast } from "sonner";
import { retryWithBackoff, handleAPIResponse } from '../../services/errorHandlingService';
import { getMarketDataCache, setMarketDataCache, getTopCoinsCache, setTopCoinsCache } from '../cache/cacheService';

let worker = null;

try {
  worker = new Worker('/marketAnalysis.worker.js');
} catch (error) {
  console.error('Error initializing Web Worker:', error);
}

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  const cacheKey = `${coin}-${days}`;
  const cachedData = getMarketDataCache(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

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
      `fetch market data for ${coin}`
    );

    const data = handleAPIResponse(response, 'market data');

    if (worker) {
      const processedData = await new Promise((resolve, reject) => {
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

      setMarketDataCache(cacheKey, processedData);
      return processedData;
    }

    setMarketDataCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    toast.error(`Error loading data: ${error.message}`);
    
    // Allow error to propagate
    throw new Error("Failed to get real market data");
  }
};

export const fetchTopCoins = async () => {
  const cachedData = getTopCoinsCache();
  
  if (cachedData) {
    return cachedData;
  }

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
      'fetch top coins'
    );

    const data = handleAPIResponse(response, 'top coins');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Coin data not available");
    }
    
    setTopCoinsCache(data);
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    toast.error(`Error loading coins: ${error.message}`);
    
    // Allow error to propagate
    throw new Error("Failed to get real coin data");
  }
};
