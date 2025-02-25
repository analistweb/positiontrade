import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, handleApiError } from '../config/api';
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

    // Se o Web Worker está disponível, use-o para cálculos pesados
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
          resolve(response.data); // Continue sem os cálculos do worker
        };

        // Envia dados para o worker
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

export const calculateEMA = (prices, period = 14) => {
  if (!prices || prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

export const getWeeklyData = (prices) => {
  if (!prices || !prices.length) return [];
  
  const weeklyData = [];
  let currentWeek = {
    high: -Infinity,
    low: Infinity,
    open: null,
    close: null
  };
  
  prices.forEach(([timestamp, price], index) => {
    const date = new Date(timestamp);
    
    if (index === 0) {
      currentWeek.open = price;
    }
    
    currentWeek.high = Math.max(currentWeek.high, price);
    currentWeek.low = Math.min(currentWeek.low, price);
    
    if (date.getDay() === 6 || index === prices.length - 1) {
      currentWeek.close = price;
      weeklyData.push({ ...currentWeek });
      currentWeek = {
        high: -Infinity,
        low: Infinity,
        open: price,
        close: null
      };
    }
  });
  
  return weeklyData;
};

export const fetchBitcoinDominance = async () => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/global`,
      {
        headers: getHeaders()
      }
    );
    
    if (!response.data?.data?.market_cap_percentage?.btc) {
      throw new Error('Dados de dominância do Bitcoin não disponíveis');
    }

    console.log('Bitcoin dominance fetched successfully:', response.data.data.market_cap_percentage.btc);
    return response.data.data.market_cap_percentage.btc;
  } catch (error) {
    const handledError = handleApiError(error, 'buscar dominância do Bitcoin');
    toast.error(handledError.message);
    throw handledError;
  }
};

export const fetchMarketSentiment = async () => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/simple/price`,
      {
        params: {
          ids: 'bitcoin',
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_last_updated_at: true
        },
        headers: getHeaders()
      }
    );

    if (!response.data?.bitcoin) {
      throw new Error('Dados de sentimento não disponíveis');
    }

    console.log('Market sentiment data fetched successfully:', response.data);
    return {
      price: response.data.bitcoin.usd,
      change24h: response.data.bitcoin.usd_24h_change,
      lastUpdated: new Date(response.data.bitcoin.last_updated_at * 1000)
    };
  } catch (error) {
    const handledError = handleApiError(error, 'buscar sentimento do mercado');
    toast.error(handledError.message);
    throw handledError;
  }
};
