import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

export const fetchMarketData = async (coin, days = 30) => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
      headers: getHeaders(),
      params: {
        vs_currency: 'usd',
        days: days,
        interval: 'hourly'
      }
    });

    return {
      prices: response.data.prices,
      total_volumes: response.data.total_volumes
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('API key não configurada ou inválida. Configure a chave VITE_COINGECKO_API_KEY no arquivo .env');
    }
    throw error;
  }
};

export const fetchCoinPrice = async (coin) => {
  const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
    headers: getHeaders(),
    params: {
      ids: coin,
      vs_currencies: 'usd',
      include_24hr_vol: true,
      include_24hr_change: true
    }
  });
  return response.data[coin];
};