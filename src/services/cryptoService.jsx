
import { axiosInstance as axios, COINGECKO_API_URL, getHeaders } from '../config/api';
import { toast } from "sonner";
import { retryWithBackoff } from './errorHandlingService';

// Dados de fallback para quando a API falhar
const fallbackTopFormationData = {
  prices: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 30000 + Math.random() * 10000]),
  market_caps: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 580000000000 + Math.random() * 20000000000]),
  total_volumes: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 20000000000 + Math.random() * 5000000000]),
  isFallbackData: true
};

const handleServiceError = (error, context) => {
  console.error(`Erro em ${context}:`, error);
  const message = error.response?.data?.error || error.message || 'Erro desconhecido';
  toast.error(`${context}: ${message}`, {
    description: "Usando dados locais enquanto tentamos reconectar"
  });
  // Em vez de lançar o erro, retornamos dados de fallback
  return { ...fallbackTopFormationData, error: message };
};

export const fetchTopFormationData = async () => {
  try {
    // Implementa timeout mais curto para não deixar o usuário esperando muito tempo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    // Buscar dados históricos mais detalhados
    const response = await retryWithBackoff(async () => {
      const res = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: 90,
          interval: 'daily'
        },
        headers: getHeaders(),
        signal: controller.signal
      });
      return res;
    }, 'Buscar dados de formação de topo');
    
    clearTimeout(timeoutId);

    if (!response.data) {
      throw new Error('Dados de formação de topo não disponíveis');
    }

    // Adicionar indicadores técnicos calculados
    const calculateMA = (prices, period) => {
      return prices.map((_, index) => {
        if (index < period - 1) return null;
        const slice = prices.slice(index - period + 1, index + 1);
        const average = slice.reduce((sum, price) => sum + price[1], 0) / period;
        return [prices[index][0], average];
      });
    };

    const prices = response.data.prices;
    const volumes = response.data.total_volumes;
    const ma20 = calculateMA(prices, 20);
    const ma50 = calculateMA(prices, 50);

    // Timestamp para mostrar quando os dados foram atualizados pela última vez
    const lastUpdated = new Date().toLocaleTimeString();

    return {
      prices: response.data.prices,
      market_caps: response.data.market_caps,
      total_volumes: response.data.total_volumes,
      moving_averages: {
        ma20,
        ma50
      },
      volume_analysis: volumes.map((volume, index) => ({
        timestamp: volume[0],
        volume: volume[1],
        average_volume: index >= 7 
          ? volumes.slice(index - 7, index).reduce((sum, v) => sum + v[1], 0) / 7 
          : volume[1]
      })),
      lastUpdated,
      isFallbackData: false
    };
  } catch (error) {
    return handleServiceError(error, 'Buscar dados de formação de topo');
  }
};
