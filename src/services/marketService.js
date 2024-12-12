import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, API_CONFIG } from '../config/api';
import { toast } from "sonner";
import { logError, logInfo } from '../config/logger';

export const fetchMarketData = async (coinId = 'bitcoin', days = 90) => {
  try {
    logInfo(`Fetching market data for ${coinId} over ${days} days...`);
    
    const response = await axios.get(
      `${COINGECKO_API_URL}/simple/price`,
      {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_vol: true,
          include_24hr_change: true,
          include_market_cap: true
        },
        headers: getHeaders()
      }
    );

    if (!response.data || !response.data[coinId]) {
      throw new Error('Dados inválidos recebidos da API');
    }

    const historicalResponse = await axios.get(
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

    if (!historicalResponse.data) {
      throw new Error('Dados históricos inválidos');
    }

    logInfo('Market data received successfully');
    return {
      current: response.data[coinId],
      historical: historicalResponse.data
    };
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
          sparkline: false,
          price_change_percentage: '24h'
        },
        headers: getHeaders()
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Dados inválidos recebidos da API');
    }

    logInfo('Top coins received successfully');
    return response.data;
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
  if (!dailyPrices || !Array.isArray(dailyPrices)) {
    return [];
  }

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