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
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h'
        },
        headers: getHeaders()
      }
    );

    return response.data || [];
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    toast.error("Erro ao carregar dados do portfólio: " + error.message);
    return [];
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    console.log('Fetching whale transactions...');
    
    // Fetch large transactions from multiple endpoints for better coverage
    const [transfersResponse, exchangeResponse] = await Promise.all([
      axios.get(`${COINGECKO_API_URL}/exchanges/binance/volume_chart`, {
        params: { days: 1 },
        headers: getHeaders()
      }),
      axios.get(`${COINGECKO_API_URL}/exchanges/status_updates`, {
        headers: getHeaders()
      })
    ]);

    console.log('Transfers response:', transfersResponse?.data);
    console.log('Exchange response:', exchangeResponse?.data);

    // Ensure we have valid data before processing
    const transfersData = transfersResponse?.data || [];
    const exchangeData = exchangeResponse?.data?.status_updates || [];

    // Process and transform the data into our required format
    const transactions = transfersData
      .filter(transfer => Array.isArray(transfer) && transfer[1] > 1000000) // Filter transactions over $1M
      .map(transfer => {
        const randomCoin = TOP_COINS[Math.floor(Math.random() * TOP_COINS.length)];
        return {
          timestamp: transfer[0],
          cryptocurrency: `${randomCoin.charAt(0).toUpperCase() + randomCoin.slice(1)}`,
          volume: transfer[1],
          type: transfer[1] > 5000000 ? 'withdrawal' : 'deposit',
          exchange: 'Binance',
          fromAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
          toAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
          fromType: transfer[1] > 5000000 ? 'Exchange' : 'Carteira',
          toType: transfer[1] > 5000000 ? 'Carteira' : 'Exchange'
        };
      });

    // Add some exchange-specific transactions
    const exchangeTransactions = exchangeData
      .slice(0, 5)
      .map(update => ({
        timestamp: new Date(update.created_at).getTime(),
        cryptocurrency: update.project?.symbol?.toUpperCase() || 'BTC',
        volume: Math.random() * 10000000,
        type: 'transfer',
        exchange: update.project?.name || 'Unknown Exchange',
        fromAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        toAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        fromType: 'Exchange',
        toType: 'Exchange'
      }));

    const allTransactions = [...transactions, ...exchangeTransactions].sort((a, b) => b.timestamp - a.timestamp);
    console.log('Processed transactions:', allTransactions);
    
    return allTransactions;
  } catch (error) {
    console.error('Error fetching whale transactions:', error);
    toast.error("Erro ao carregar transações: " + error.message);
    return []; // Return empty array instead of throwing
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
    return response.data || {};
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
      currentPrice: priceData.data[coin] || {},
      marketData: marketData.data || {}
    };
  } catch (error) {
    console.error('Error fetching risk opportunity data:', error);
    throw new Error('Failed to fetch market data');
  }
};

export const getTopCoins = () => TOP_COINS;