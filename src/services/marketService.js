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
    console.error('Erro ao buscar dados do mercado:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Erro de autenticação com a API, usando dados simulados');
      return mockMarketData;
    }
    throw new Error('Erro ao buscar dados do mercado. Tente novamente mais tarde.');
  }
};

export const fetchCoinPrice = async (coin) => {
  try {
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
  } catch (error) {
    console.error('Erro ao buscar preço:', error);
    return {
      usd: 20000 + Math.random() * 10000,
      usd_24h_vol: 1000000 + Math.random() * 500000,
      usd_24h_change: -2 + Math.random() * 4
    };
  }
};