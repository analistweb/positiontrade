import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

const TOP_COINS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'ripple',
  'cardano',
  'avalanche-2',
  'polkadot',
  'dogecoin',
  'chainlink'
];

export const fetchTopFormationData = async (coin = 'bitcoin') => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
      headers: getHeaders(),
      params: {
        vs_currency: 'usd',
        days: 90,
        interval: 'daily',
        include_market_cap: true,
        include_24hr_vol: true
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
  try {
    // Mock data for development/testing since CoinGecko API has rate limits
    const mockLiquidations = [
      {
        exchange: "Binance",
        amount: 5000000,
        type: "long",
        timestamp: Date.now()
      },
      {
        exchange: "Bybit",
        amount: 3000000,
        type: "short",
        timestamp: Date.now() - 300000
      },
      {
        exchange: "OKX",
        amount: 2000000,
        type: "long",
        timestamp: Date.now() - 600000
      }
    ];

    // Calculate totals from mock data
    const totalLiquidated = mockLiquidations.reduce((sum, liq) => sum + liq.amount, 0);
    const longLiquidated = mockLiquidations
      .filter(liq => liq.type === 'long')
      .reduce((sum, liq) => sum + liq.amount, 0);
    const shortLiquidated = mockLiquidations
      .filter(liq => liq.type === 'short')
      .reduce((sum, liq) => sum + liq.amount, 0);

    return {
      liquidations: mockLiquidations,
      totalLiquidated,
      longLiquidated,
      shortLiquidated
    };
  } catch (error) {
    console.error('Error fetching liquidation data:', error);
    throw new Error('Failed to fetch liquidation data');
  }
};

export const getTopCoins = () => TOP_COINS;