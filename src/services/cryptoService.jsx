import axios from '../config/api';
import { toast } from "sonner";
import { MOCK_DATA } from '../config/api';

const handleServiceError = (error, context) => {
  console.error(`Erro em ${context}:`, error);
  const message = error.response?.data?.error || error.message || 'Erro desconhecido';
  toast.error(`${context}: ${message}`);
  return null;
};

export const fetchPortfolioData = async () => {
  try {
    const response = await axios.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h',
        locale: 'pt'
      }
    });

    return response.data?.map(coin => ({
      ...coin,
      quantity: Number((Math.random() * 10).toFixed(4)),
      value_usd: Number((Math.random() * 10000).toFixed(2))
    })) || [];
  } catch (error) {
    handleServiceError(error, 'Buscar dados do portfólio');
    return [];
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    const response = await axios.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'volume_desc',
        per_page: 5,
        sparkline: false
      }
    });

    if (!response.data?.length) {
      throw new Error('Dados não disponíveis');
    }

    return response.data.flatMap(coin => {
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
  } catch (error) {
    handleServiceError(error, 'Buscar transações de grandes players');
    return [];
  }
};

export const fetchTopFormationData = async () => {
  try {
    const response = await axios.get('/coins/bitcoin/market_chart', {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      }
    });

    if (!response.data?.prices?.length) {
      console.warn('Dados não disponíveis, usando mock');
      return MOCK_DATA.bitcoin;
    }

    return {
      prices: response.data.prices,
      total_volumes: response.data.total_volumes,
      market_caps: response.data.market_caps
    };
  } catch (error) {
    console.warn('Erro ao buscar dados, usando mock:', error);
    return MOCK_DATA.bitcoin;
  }
};