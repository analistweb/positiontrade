import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, handleApiError, MOCK_DATA } from '../config/api';
import { toast } from "sonner";

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coin}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        headers: getHeaders()
      }
    );

    return response.data;
  } catch (error) {
    const handledError = handleApiError(error, 'buscar dados de mercado');
    toast.error(handledError.message);
    
    // Retorna dados mockados em caso de erro
    console.log('Usando dados mockados devido a erro na API');
    return MOCK_DATA[coin] || MOCK_DATA.bitcoin;
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
          sparkline: false
        },
        headers: getHeaders()
      }
    );

    return response.data;
  } catch (error) {
    const handledError = handleApiError(error, 'buscar top moedas');
    toast.error(handledError.message);
    
    // Retorna lista mockada em caso de erro
    return [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'eth' },
      { id: 'binancecoin', name: 'BNB', symbol: 'bnb' },
      { id: 'ripple', name: 'XRP', symbol: 'xrp' },
      { id: 'cardano', name: 'Cardano', symbol: 'ada' }
    ];
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