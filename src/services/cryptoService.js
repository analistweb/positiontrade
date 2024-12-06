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
    const response = await axios.get(`${COINGECKO_API_URL}/exchanges/binance/volume_chart`, {
      params: { days: 1 },
      headers: getHeaders()
    });

    // Simulando dados mais detalhados enquanto aguardamos integração com API específica
    return response.data.slice(0, 10).map(([timestamp, volume]) => {
      const isExchangeToWallet = Math.random() > 0.5;
      const amount = (volume / 40000); // Convertendo volume aproximado para BTC
      
      return {
        timestamp,
        amount,
        from: isExchangeToWallet ? 'exchange-binance' : `wallet-${Math.random().toString(36).substring(7)}`,
        to: isExchangeToWallet ? `wallet-${Math.random().toString(36).substring(7)}` : 'exchange-binance',
        type: isExchangeToWallet ? 'ACUMULAÇÃO' : 'DISTRIBUIÇÃO'
      };
    });
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
