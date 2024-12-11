import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, API_CONFIG } from '../config/api';
import { toast } from "sonner";
import { logError, logInfo } from '../config/logger';

export const fetchMarketData = async (coinId, days) => {
  try {
    logInfo(`Fetching market data for ${coinId} over ${days} days...`);
    
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        headers: getHeaders(),
        timeout: 10000 // 10 segundos timeout
      }
    );

    logInfo('Market data received:', response?.data);
    return response?.data || {};
  } catch (error) {
    logError('Error fetching market data:', error);
    
    const errorMessage = error.response?.data?.status?.error_message || error.message;
    toast.error(`Erro ao carregar dados de mercado: ${errorMessage}`);
    
    throw error; // Propaga o erro para ser tratado pelo React Query
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
        headers: getHeaders(),
        timeout: 10000
      }
    );

    logInfo('Top coins received:', response?.data);
    return response?.data || [];
  } catch (error) {
    logError('Error fetching top coins:', error);
    toast.error(`Erro ao carregar top moedas: ${error.message}`);
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
  
  // Assuming prices are ordered from oldest to newest
  dailyPrices.forEach((price, index) => {
    currentWeek.push(price);
    
    // Check if it's the last day of the week (every 7 days) or last price
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

export const fetchBitcoinDominance = async () => {
  try {
    logInfo('Fetching Bitcoin dominance data...');
    
    const response = await axios.get(
      `${COINGECKO_API_URL}/global`,
      {
        headers: getHeaders(),
        timeout: 10000
      }
    );

    const dominance = response?.data?.data?.market_cap_percentage?.btc || 0;
    logInfo('Bitcoin dominance data received:', dominance);
    
    return dominance;
  } catch (error) {
    logError('Error fetching Bitcoin dominance:', error);
    toast.error(`Erro ao carregar dominância do Bitcoin: ${error.message}`);
    throw error;
  }
};
