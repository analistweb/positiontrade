import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, handleApiError, MOCK_DATA } from '../config/api';
import { toast } from "sonner";

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  try {
    console.log('Fetching market data for:', coin);
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coin}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        headers: getHeaders(),
        timeout: 5000 // 5 second timeout
      }
    );

    if (!response.data) {
      console.warn('No data available, falling back to mock data');
      return MOCK_DATA[coin] || MOCK_DATA.bitcoin;
    }

    console.log('Market data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    const handledError = handleApiError(error, 'buscar dados de mercado');
    
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.warn('Network error, falling back to mock data');
      return MOCK_DATA[coin] || MOCK_DATA.bitcoin;
    }
    
    throw handledError;
  }
};

export const fetchTopCoins = async () => {
  try {
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

    if (!response.data) {
      throw new Error('Dados não disponíveis');
    }

    console.log('Top coins fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    const handledError = handleApiError(error, 'buscar top moedas');
    toast.error(handledError.message);
    throw handledError;
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
