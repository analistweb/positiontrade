import axios from 'axios';
import { toast } from "sonner";

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const api = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  }
});

// Interceptor para retry em caso de falha
api.interceptors.response.use(undefined, async (err) => {
  const { config, message } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  config.retry -= 1;
  
  if (config.retry === 0) {
    toast.error(`Erro ao buscar dados: ${message}`);
    return Promise.reject(err);
  }

  const backoff = new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, config.retryDelay || 1000);
  });

  await backoff;
  return api(config);
});

export const fetchPortfolioData = async () => {
  try {
    const response = await api.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h',
        locale: 'pt'
      },
      retry: 3,
      retryDelay: 1000
    });

    if (!response.data) {
      throw new Error('Dados não disponíveis');
    }

    return response.data.map(coin => ({
      ...coin,
      quantity: Number((Math.random() * 10).toFixed(4)),
      value_usd: Number((Math.random() * 10000).toFixed(2))
    }));
  } catch (error) {
    console.error('Erro ao carregar dados do portfólio:', error);
    toast.error("Erro ao carregar dados do portfólio");
    throw error;
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    const response = await api.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'volume_desc',
        per_page: 5,
        sparkline: false
      }
    });

    if (!response.data) {
      throw new Error('Dados não disponíveis');
    }

    const transactions = response.data.flatMap(coin => {
      const baseTime = Date.now();
      return Array(2).fill().map((_, index) => ({
        timestamp: baseTime - index * 3600000,
        type: Math.random() > 0.5 ? "Compra" : "Venda",
        cryptoAmount: Number((Math.random() * 100).toFixed(2)),
        cryptoSymbol: coin.symbol.toUpperCase(),
        volume: Number((Math.random() * coin.current_price * 1000).toFixed(2)),
        destination: Math.random() > 0.5 ? "Carteira" : "Exchange",
        destinationAddress: `0x${Array(40).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        exchange: ["Binance", "Coinbase", "Kraken", "FTX"][Math.floor(Math.random() * 4)]
      }));
    });

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    toast.error("Erro ao carregar transações");
    throw error;
  }
};

export const fetchTopFormationData = async () => {
  try {
    const response = await api.get('/coins/bitcoin/market_chart', {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      },
      retry: 3,
      retryDelay: 1000
    });

    if (!response.data || !response.data.prices || !response.data.total_volumes) {
      throw new Error('Dados de formação de topo não disponíveis');
    }

    return {
      prices: response.data.prices,
      total_volumes: response.data.total_volumes,
      market_caps: response.data.market_caps
    };
  } catch (error) {
    console.error('Erro ao carregar dados de formação de topo:', error);
    toast.error("Erro ao carregar dados: " + (error.response?.data?.error || error.message));
    throw error;
  }
};
