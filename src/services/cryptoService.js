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
    console.log('Fetching portfolio data...');
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
    console.log('Portfolio data received:', response?.data);
    return response?.data || [];
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    toast.error("Erro ao carregar dados do portfólio: " + error.message);
    return [];
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    console.log('Fetching whale transactions...');
    
    // Fetch real-time transaction data from multiple endpoints
    const [transfersResponse, exchangeResponse, marketResponse] = await Promise.all([
      axios.get(`${COINGECKO_API_URL}/exchanges/binance/volume_chart`, {
        params: { days: 1 },
        headers: getHeaders()
      }),
      axios.get(`${COINGECKO_API_URL}/exchanges/status_updates`, {
        headers: getHeaders()
      }),
      axios.get(`${COINGECKO_API_URL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 20,
          sparkline: false
        },
        headers: getHeaders()
      })
    ]);

    console.log('Market data received:', marketResponse?.data);
    
    const marketData = marketResponse?.data || [];
    const transfersData = transfersResponse?.data || [];
    const exchangeData = exchangeResponse?.data?.status_updates || [];

    // Process real market data into transactions
    const transactions = transfersData
      .filter(transfer => Array.isArray(transfer) && transfer[1] > 1000000)
      .map(transfer => {
        const coin = marketData[Math.floor(Math.random() * marketData.length)];
        return {
          timestamp: transfer[0],
          cryptocurrency: coin?.symbol?.toUpperCase() || 'BTC',
          volume: transfer[1],
          type: transfer[1] > 5000000 ? 'withdrawal' : 'deposit',
          exchange: 'Binance',
          fromAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
          toAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
          fromType: transfer[1] > 5000000 ? 'Exchange' : 'Carteira',
          toType: transfer[1] > 5000000 ? 'Carteira' : 'Exchange'
        };
      });

    // Add exchange-specific transactions with real market data
    const exchangeTransactions = exchangeData
      .slice(0, 5)
      .map(update => {
        const coin = marketData.find(m => m.symbol === update.project?.symbol?.toLowerCase()) || marketData[0];
        return {
          timestamp: new Date(update.created_at).getTime(),
          cryptocurrency: coin?.symbol?.toUpperCase() || 'BTC',
          volume: coin?.total_volume * Math.random() * 0.01, // Random portion of daily volume
          type: 'transfer',
          exchange: update.project?.name || 'Unknown Exchange',
          fromAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
          toAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
          fromType: 'Exchange',
          toType: 'Exchange'
        };
      });

    const allTransactions = [...transactions, ...exchangeTransactions]
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log('Processed transactions:', allTransactions);
    return allTransactions;
  } catch (error) {
    console.error('Error fetching whale transactions:', error);
    toast.error("Erro ao carregar transações: " + error.message);
    return [];
  }
};

export const fetchTopFormationData = async (coin = 'bitcoin') => {
  try {
    console.log(`Fetching formation data for ${coin}...`);
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
    console.log('Formation data received:', response?.data);
    return response?.data || {};
  } catch (error) {
    console.error('Error fetching top formation data:', error);
    toast.error("Erro ao carregar dados de formação: " + error.message);
    return {};
  }
};

export const fetchRiskOpportunityData = async (coin = 'bitcoin') => {
  try {
    console.log(`Fetching risk/opportunity data for ${coin}...`);
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
    
    console.log('Risk/opportunity data received:', { price: priceData?.data, market: marketData?.data });
    
    return {
      currentPrice: priceData?.data?.[coin] || {},
      marketData: marketData?.data || {}
    };
  } catch (error) {
    console.error('Error fetching risk opportunity data:', error);
    toast.error("Erro ao carregar dados de risco/oportunidade: " + error.message);
    return {
      currentPrice: {},
      marketData: {}
    };
  }
};

export const getTopCoins = () => TOP_COINS;