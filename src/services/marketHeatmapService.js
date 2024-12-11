import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';
import { logError, logInfo } from '../config/logger';
import { ERROR_MESSAGES } from '../config/constants';

export const fetchMarketHeatmapData = async () => {
  logInfo('Fetching market heatmap data...');
  
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 8,
          sparkline: false,
          price_change_percentage: '24h'
        },
        headers: getHeaders()
      }
    );

    logInfo('Market heatmap data received:', response.data);

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATA);
    }

    return response.data.map(coin => ({
      name: coin.name,
      change: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      color: coin.price_change_percentage_24h >= 0 ? 'bg-green-500' : 'bg-red-500'
    }));
  } catch (error) {
    logError(error, 'MarketHeatmap');
    const errorMessage = error.response?.status === 429 
      ? ERROR_MESSAGES.RATE_LIMIT
      : ERROR_MESSAGES.GENERIC_ERROR;
    throw new Error(errorMessage);
  }
};