
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, handleApiError } from '../../config/api';
import { toast } from "sonner";

export const fetchBitcoinDominance = async () => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/global`,
      {
        headers: getHeaders()
      }
    );
    
    if (!response.data?.data?.market_cap_percentage?.btc) {
      throw new Error('Dados de dominância do Bitcoin não disponíveis');
    }

    console.log('Bitcoin dominance fetched successfully:', response.data.data.market_cap_percentage.btc);
    return response.data.data.market_cap_percentage.btc;
  } catch (error) {
    const handledError = handleApiError(error, 'buscar dominância do Bitcoin');
    toast.error(handledError.message);
    throw handledError;
  }
};

export const fetchMarketSentiment = async () => {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/simple/price`,
      {
        params: {
          ids: 'bitcoin',
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_last_updated_at: true
        },
        headers: getHeaders()
      }
    );

    if (!response.data?.bitcoin) {
      throw new Error('Dados de sentimento não disponíveis');
    }

    console.log('Market sentiment data fetched successfully:', response.data);
    return {
      price: response.data.bitcoin.usd,
      change24h: response.data.bitcoin.usd_24h_change,
      lastUpdated: new Date(response.data.bitcoin.last_updated_at * 1000)
    };
  } catch (error) {
    const handledError = handleApiError(error, 'buscar sentimento do mercado');
    toast.error(handledError.message);
    throw handledError;
  }
};
