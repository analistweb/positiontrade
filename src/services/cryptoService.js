import axios from 'axios';
import { toast } from "sonner";

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

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
      }
    });

    return response.data;
  } catch (error) {
    toast.error("Erro ao carregar dados do portfólio: " + error.message);
    throw error;
  }
};

export const fetchTopFormationData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      }
    });

    return {
      prices: response.data.prices,
      total_volumes: response.data.total_volumes,
      market_caps: response.data.market_caps
    };
  } catch (error) {
    console.error('Error fetching top formation data:', error);
    throw new Error('Failed to fetch market data. Please try again later.');
  }
};

export const fetchWhaleTransactions = async () => {
  const mockTransactions = [
    {
      timestamp: Date.now(),
      type: "Compra",
      cryptoAmount: 150,
      cryptoSymbol: "BTC",
      volume: 6000000,
      destination: "Wallet",
      destinationAddress: "bc1q...3kf9",
      exchange: null
    },
    {
      timestamp: Date.now() - 1800000,
      type: "Venda",
      cryptoAmount: 2000,
      cryptoSymbol: "ETH",
      volume: 4000000,
      destination: "Exchange",
      destinationAddress: null,
      exchange: "Binance"
    },
    {
      timestamp: Date.now() - 3600000,
      type: "Compra",
      cryptoAmount: 1000000,
      cryptoSymbol: "XRP",
      volume: 500000,
      destination: "Wallet",
      destinationAddress: "rB5...9Uj",
      exchange: null
    },
    {
      timestamp: Date.now() - 5400000,
      type: "Venda",
      cryptoAmount: 500,
      cryptoSymbol: "SOL",
      volume: 2000000,
      destination: "Exchange",
      destinationAddress: null,
      exchange: "Coinbase"
    },
    {
      timestamp: Date.now() - 7200000,
      type: "Compra",
      cryptoAmount: 300,
      cryptoSymbol: "ADA",
      volume: 1500000,
      destination: "Wallet",
      destinationAddress: "addr1...xyz",
      exchange: null
    },
    {
      timestamp: Date.now() - 9000000,
      type: "Venda",
      cryptoAmount: 100,
      cryptoSymbol: "BTC",
      volume: 500000,
      destination: "Exchange",
      destinationAddress: null,
      exchange: "Kraken"
    },
    {
      timestamp: Date.now() - 10800000,
      type: "Compra",
      cryptoAmount: 250,
      cryptoSymbol: "ETH",
      volume: 3000000,
      destination: "Wallet",
      destinationAddress: "bc1q...abc",
      exchange: null
    },
    {
      timestamp: Date.now() - 12600000,
      type: "Venda",
      cryptoAmount: 400,
      cryptoSymbol: "XRP",
      volume: 1000000,
      destination: "Exchange",
      destinationAddress: null,
      exchange: "FTX"
    },
    {
      timestamp: Date.now() - 14400000,
      type: "Compra",
      cryptoAmount: 600,
      cryptoSymbol: "SOL",
      volume: 2500000,
      destination: "Wallet",
      destinationAddress: "addr1...abc",
      exchange: null
    },
    {
      timestamp: Date.now() - 16200000,
      type: "Venda",
      cryptoAmount: 800,
      cryptoSymbol: "ADA",
      volume: 1200000,
      destination: "Exchange",
      destinationAddress: null,
      exchange: "Binance"
    }
  ];

  return mockTransactions;
};
