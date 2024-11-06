import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

const mockMarketData = {
  prices: Array.from({ length: 30 }, (_, i) => [
    Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
    20000 + Math.random() * 10000
  ]),
  total_volumes: Array.from({ length: 30 }, (_, i) => [
    Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
    1000000 + Math.random() * 500000
  ])
};

export const fetchMarketData = async (coin, days = 30) => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
        interval: 'daily'
      },
      headers: getHeaders(),
      timeout: 10000 // 10 second timeout
    });

    return {
      prices: response.data.prices,
      total_volumes: response.data.total_volumes
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      return mockMarketData; // Return mock data on network errors
    }
    throw new Error('Failed to fetch market data. Please try again later.');
  }
};

export const fetchCoinPrice = async (coin) => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: coin,
        vs_currencies: 'usd',
        include_24hr_vol: true,
        include_24hr_change: true
      },
      headers: getHeaders(),
      timeout: 10000
    });
    return response.data[coin];
  } catch (error) {
    console.error('Error fetching price:', error);
    return {
      usd: 20000 + Math.random() * 10000,
      usd_24h_vol: 1000000 + Math.random() * 500000,
      usd_24h_change: -2 + Math.random() * 4
    };
  }
};