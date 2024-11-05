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
    if (error.response?.status === 429) {
      throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
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
    throw new Error('Erro ao buscar preço. Tente novamente mais tarde.');
  }
};