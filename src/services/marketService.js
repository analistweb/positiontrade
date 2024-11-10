import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

export const fetchMarketData = async (coinId, days) => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coinId}/market_chart`,
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
    throw new Error('Failed to fetch market data');
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
    throw new Error('Failed to fetch top coins');
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

export const calculateEMA = (prices, period = 56) => { // 8 weeks = 56 days
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