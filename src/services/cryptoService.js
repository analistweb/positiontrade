import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

export const fetchTopFormationData = async (coin = 'bitcoin') => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
      headers: getHeaders(),
      params: {
        vs_currency: 'usd',
        days: 90,
        interval: 'hourly'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados de formação de topo:', error);
    throw error;
  }
};

export const fetchRiskOpportunityData = async (coin = 'bitcoin') => {
  try {
    const [priceData, marketData] = await Promise.all([
      axios.get(`${COINGECKO_API_URL}/simple/price`, {
        headers: getHeaders(),
        params: {
          ids: coin,
          vs_currencies: 'usd',
          include_24hr_vol: true,
          include_24hr_change: true,
          include_market_cap: true
        }
      }),
      axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
        headers: getHeaders(),
        params: {
          vs_currency: 'usd',
          days: 30,
          interval: 'daily'
        }
      })
    ]);
    return {
      currentPrice: priceData.data[coin],
      marketData: marketData.data
    };
  } catch (error) {
    console.error('Erro ao buscar dados de risco e oportunidade:', error);
    throw error;
  }
};

export const fetchLiquidationsData = async () => {
  try {
    const response = await axios.get('https://api.coinglass.com/api/v3/futures/liquidation', {
      headers: {
        'coinglassSecret': import.meta.env.VITE_COINGLASS_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados de liquidações:', error);
    throw error;
  }
};