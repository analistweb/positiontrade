import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, handleApiError } from '../config/api';
import { toast } from "sonner";

// Mock data for when API fails
const MOCK_MARKET_DATA = {
  prices: Array.from({ length: 30 }, (_, i) => [
    Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
    40000 + Math.random() * 5000
  ]),
  market_caps: Array.from({ length: 30 }, (_, i) => [
    Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
    800000000000 + Math.random() * 50000000000
  ]),
  total_volumes: Array.from({ length: 30 }, (_, i) => [
    Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
    30000000000 + Math.random() * 5000000000
  ])
};

const MOCK_TOP_COINS = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 45000,
    market_cap: 800000000000,
    market_cap_rank: 1,
    price_change_percentage_24h: 2.5
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 2500,
    market_cap: 300000000000,
    market_cap_rank: 2,
    price_change_percentage_24h: 1.8
  }
];

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
        timeout: 5000 // 5 second timeout
      }
    );

    if (!response.data) {
      console.warn('No data received from API, falling back to mock data');
      return MOCK_MARKET_DATA;
    }

    console.log('Market data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    toast.error(`Erro ao carregar dados de mercado: ${error.message}. Usando dados simulados.`);
    return MOCK_MARKET_DATA;
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
      console.warn('No data received from API, falling back to mock data');
      return MOCK_TOP_COINS;
    }

    console.log('Top coins fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    toast.error(`Erro ao carregar top moedas: ${error.message}. Usando dados simulados.`);
    return MOCK_TOP_COINS;
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
