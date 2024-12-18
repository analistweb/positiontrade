import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';
import { toast } from "sonner";

const api = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 10000
});

// Implementa delay entre tentativas
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função de retry com backoff exponencial
const fetchWithRetry = async (fn, retries = 3, backoff = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    if (error.response?.status === 429) {
      await delay(backoff);
      return fetchWithRetry(fn, retries - 1, backoff * 2);
    }
    
    throw error;
  }
};

export const fetchMarketData = async (coinId, days) => {
  try {
    const response = await fetchWithRetry(() => 
      api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        headers: getHeaders()
      })
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados de mercado:', error);
    toast.error('Erro ao carregar dados de mercado. Tentando novamente...');
    throw error;
  }
};

export const fetchTopCoins = async () => {
  try {
    const response = await fetchWithRetry(() =>
      api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false
        },
        headers: getHeaders()
      })
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar top moedas:', error);
    toast.error('Erro ao carregar lista de moedas. Tentando novamente...');
    throw error;
  }
};

export const fetchBitcoinDominance = async () => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/global`,
      {
        headers: getHeaders()
      }
    );
    return response.data.data.market_cap_percentage.btc;
  } catch (error) {
    throw new Error('Failed to fetch Bitcoin dominance');
  }
};

export const fetchPriceData = async () => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 5,
          sparkline: true
        },
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch price data');
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

export const calculateRSI = (prices) => {
  if (!prices || !Array.isArray(prices) || prices.length < 14) {
    console.log('Invalid price data for RSI calculation:', prices);
    return null;
  }
  
  try {
    const values = prices.map(price => price[1]);
    const changes = [];
    
    for (let i = 1; i < values.length; i++) {
      changes.push(values[i] - values[i - 1]);
    }
    
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
    
    const period = 14;
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
    
    const rsiValues = [];
    let rs = avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
    
    for (let i = period; i < changes.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return rsiValues[rsiValues.length - 1];
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return null;
  }
};
