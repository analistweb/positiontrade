import axios from 'axios';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

export const fetchETHUSDTData = async (interval = '15m', limit = 100) => {
  try {
    const response = await axios.get(`${BINANCE_API_BASE}/klines`, {
      params: {
        symbol: 'ETHUSDT',
        interval,
        limit
      }
    });

    return response.data.map(candle => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  } catch (error) {
    console.error('Erro ao buscar dados da Binance:', error);
    throw new Error('Falha ao carregar dados de mercado ETHUSDT');
  }
};
