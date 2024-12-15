import axios from 'axios';
import { toast } from "sonner";

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const WHALE_ALERT_API_URL = 'https://api.whale-alert.io/v1';
const WHALE_ALERT_API_KEY = import.meta.env.VITE_WHALE_ALERT_API_KEY;

// Configuração do axios com timeout e retry
const api = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
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
    return Promise.reject(err);
  }

  // Delay exponencial entre tentativas
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

    return response.data;
  } catch (error) {
    console.error('Erro ao carregar dados do portfólio:', error);
    toast.error("Erro ao carregar dados do portfólio: " + (error.response?.data?.error || error.message));
    throw error;
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    if (!WHALE_ALERT_API_KEY) {
      console.warn("Chave da API Whale Alert não configurada. Usando dados simulados.");
      return getMockWhaleTransactions();
    }

    const response = await axios.get(`${WHALE_ALERT_API_URL}/transactions`, {
      params: {
        api_key: WHALE_ALERT_API_KEY,
        min_value: 500000,
        blockchain: 'bitcoin,ethereum,tron',
        start: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
        end: Math.floor(Date.now() / 1000),
      },
      retry: 3,
      retryDelay: 1000
    });

    if (!response.data?.transactions) {
      throw new Error('Dados de transações não disponíveis');
    }

    return processWhaleAlertTransactions(response.data.transactions);
  } catch (error) {
    console.error('Erro ao buscar transações de baleias:', error);
    toast.error("Erro ao buscar transações: " + (error.response?.data?.error || error.message));
    return getMockWhaleTransactions();
  }
};

const processWhaleAlertTransactions = (transactions) => {
  if (!Array.isArray(transactions)) {
    console.error('Dados de transações inválidos');
    return [];
  }

  return transactions.map(tx => ({
    timestamp: tx.timestamp * 1000,
    type: tx.from.owner_type === 'exchange' ? 'Venda' : 'Compra',
    cryptoAmount: tx.amount,
    cryptoSymbol: tx.symbol.toUpperCase(),
    volume: tx.amount_usd,
    destination: tx.to.owner_type === 'exchange' ? 'Exchange' : 'Carteira',
    destinationAddress: tx.to.address,
    exchange: tx.to.owner_type === 'exchange' ? tx.to.owner : null
  })).slice(0, 10);
};

const getMockWhaleTransactions = () => {
  return [
    {
      timestamp: Date.now(),
      type: "Compra",
      cryptoAmount: 150.75,
      cryptoSymbol: "BTC",
      volume: 6500000,
      destination: "Carteira",
      destinationAddress: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5",
      exchange: null
    },
    {
      timestamp: Date.now() - 3600000,
      type: "Venda",
      cryptoAmount: 2500,
      cryptoSymbol: "ETH",
      volume: 4800000,
      destination: "Exchange",
      destinationAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      exchange: "Binance"
    }
  ];
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