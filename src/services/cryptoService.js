import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';
import { toast } from "sonner";

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

export const fetchPortfolioData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h'
      },
      headers: getHeaders()
    });

    return response.data;
  } catch (error) {
    toast.error("Erro ao carregar dados do portfólio: " + error.message);
    throw error;
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    // Simulando dados de transações de baleias com informações mais detalhadas
    const mockTransactions = [
      {
        timestamp: Date.now(),
        cryptocurrency: 'Bitcoin (BTC)',
        volume: 5000000,
        type: 'withdrawal',
        exchange: 'Binance',
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        toAddress: '0x123f681646d4a755815f9cb19e1acc8565a0c2ac',
        fromType: 'Exchange',
        toType: 'Carteira'
      },
      {
        timestamp: Date.now() - 3600000,
        cryptocurrency: 'Ethereum (ETH)',
        volume: 3000000,
        type: 'deposit',
        exchange: 'Coinbase',
        fromAddress: '0x456f681646d4a755815f9cb19e1acc8565a0c2ac',
        toAddress: '0x789d35Cc6634C0532925a3b844Bc454e4438f44e',
        fromType: 'Carteira',
        toType: 'Exchange'
      },
      {
        timestamp: Date.now() - 7200000,
        cryptocurrency: 'Cardano (ADA)',
        volume: 2000000,
        type: 'transfer',
        fromAddress: '0xabcf681646d4a755815f9cb19e1acc8565a0c2ac',
        toAddress: '0xdefd35Cc6634C0532925a3b844Bc454e4438f44e',
        fromType: 'Carteira',
        toType: 'Carteira'
      }
    ];

    return mockTransactions;
  } catch (error) {
    toast.error("Erro ao carregar transações: " + error.message);
    throw error;
  }
};

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

export const getTopCoins = () => TOP_COINS;