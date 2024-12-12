import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';
import { toast } from "sonner";
import { logError, logInfo } from '../config/logger';

export const fetchMarketData = async (coinId = 'bitcoin', days = 90) => {
  try {
    logInfo(`Fetching market data for ${coinId} over ${days} days...`);
    
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days > 90 ? 'daily' : 'hourly'
        },
        headers: getHeaders()
      }
    );

    if (!response.data) {
      throw new Error('No data received from API');
    }

    logInfo('Market data received:', response.data);
    return response.data;
  } catch (error) {
    logError('Error fetching market data:', error);
    const errorMessage = error.response?.data?.error || error.message;
    toast.error(`Erro ao carregar dados de mercado: ${errorMessage}`);
    throw error;
  }
};

export const fetchTopCoins = async () => {
  try {
    logInfo('Fetching top coins...');
    
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false
        },
        headers: getHeaders()
      }
    );

    if (!response.data) {
      throw new Error('No data received from API');
    }

    logInfo('Top coins received:', response.data);
    return response.data;
  } catch (error) {
    logError('Error fetching top coins:', error);
    toast.error(`Erro ao carregar top moedas: ${error.message}`);
    throw error;
  }
};

export const fetchBitcoinDominance = async () => {
  try {
    logInfo('Fetching Bitcoin dominance data...');
    
    const response = await axios.get(
      `${COINGECKO_API_URL}/global`,
      {
        headers: getHeaders()
      }
    );

    if (!response.data?.data?.market_cap_percentage?.btc) {
      throw new Error('Invalid Bitcoin dominance data received');
    }

    const dominance = response.data.data.market_cap_percentage.btc;
    logInfo('Bitcoin dominance data received:', dominance);
    
    return dominance;
  } catch (error) {
    logError('Error fetching Bitcoin dominance:', error);
    toast.error(`Erro ao carregar dominância do Bitcoin: ${error.message}`);
    throw error;
  }
};

export const calculateEMA = (prices, period = 56) => {
  if (!prices || prices.length < period) {
    return null;
  }
  
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

export const getWeeklyData = (dailyPrices) => {
  const weeklyData = [];
  let currentWeek = [];
  
  dailyPrices.forEach((price, index) => {
    currentWeek.push(price);
    
    if ((index + 1) % 7 === 0 || index === dailyPrices.length - 1) {
      const weekHigh = Math.max(...currentWeek.map(p => p[1]));
      const weekClose = currentWeek[currentWeek.length - 1][1];
      const weekTimestamp = currentWeek[currentWeek.length - 1][0];
      
      weeklyData.push({
        timestamp: weekTimestamp,
        high: weekHigh,
        close: weekClose
      });
      
      currentWeek = [];
    }
  });
  
  return weeklyData;
};
