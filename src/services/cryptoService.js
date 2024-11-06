import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

export const fetchTopFormationData = async (coin = 'bitcoin') => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
      headers: getHeaders(),
      params: {
        vs_currency: 'usd',
        days: 90,
        interval: 'daily'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top formation data:', error);
    throw new Error('Failed to fetch market data');
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
        },
        timeout: 10000
      }),
      axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
        headers: getHeaders(),
        params: {
          vs_currency: 'usd',
          days: 30,
          interval: 'daily'
        },
        timeout: 10000
      })
    ]);
    return {
      currentPrice: priceData.data[coin],
      marketData: marketData.data
    };
  } catch (error) {
    console.error('Error fetching risk opportunity data:', error);
    throw new Error('Failed to fetch market data');
  }
};

export const fetchLiquidationsData = async () => {
  // Return mock data since we don't have access to CoinGlass API
  return {
    liquidations: [
      {
        exchange: "Binance",
        amount: 1500000,
        type: "long",
        timestamp: Date.now()
      },
      {
        exchange: "Bybit",
        amount: 2000000,
        type: "short",
        timestamp: Date.now() - 300000
      }
    ],
    totalLiquidated: 3500000,
    longShortRate: 1.5
  };
};