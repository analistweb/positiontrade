import axios from '../config/api';
import { toast } from "sonner";
import { COINGECKO_API_URL, getHeaders } from '../config/api';

const handleServiceError = (error, context) => {
  console.error(`Erro em ${context}:`, error);
  const message = error.response?.data?.error || error.message || 'Erro desconhecido';
  toast.error(`${context}: ${message}`);
  throw new Error(message);
};

export const fetchPortfolioData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h',
        locale: 'pt'
      },
      headers: getHeaders()
    });

    if (!response.data) {
      throw new Error('Dados não disponíveis');
    }

    return response.data;
  } catch (error) {
    return handleServiceError(error, 'Buscar dados do portfólio');
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'volume_desc',
        per_page: 5,
        sparkline: false
      },
      headers: getHeaders()
    });

    if (!response.data?.length) {
      throw new Error('Dados não disponíveis');
    }

    return response.data;
  } catch (error) {
    return handleServiceError(error, 'Buscar transações de grandes players');
  }
};

export const fetchTopFormationData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      },
      headers: getHeaders()
    });

    if (!response.data?.prices?.length) {
      throw new Error('Dados de preço não disponíveis');
    }

    return {
      prices: response.data.prices,
      total_volumes: response.data.total_volumes,
      market_caps: response.data.market_caps
    };
  } catch (error) {
    return handleServiceError(error, 'Buscar dados de formação de topo');
  }
};