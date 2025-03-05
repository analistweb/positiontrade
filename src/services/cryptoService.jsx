
import { axiosInstance as axios, COINGECKO_API_URL, getHeaders } from '../config/api';
import { toast } from "sonner";

const handleServiceError = (error, context) => {
  console.error(`Erro em ${context}:`, error);
  const message = error.response?.data?.error || error.message || 'Erro desconhecido';
  toast.error(`${context}: ${message}`);
  throw new Error(message);
};

export const fetchTopFormationData = async () => {
  try {
    // Buscar dados históricos mais detalhados
    const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 90, // Aumentado para 90 dias para melhor análise
        interval: 'daily'
      },
      headers: getHeaders()
    });

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
      }))
    };
  } catch (error) {
    return handleServiceError(error, 'Buscar dados de formação de topo');
  }
};
