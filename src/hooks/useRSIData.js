import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner";
import { calculateRSI } from '../utils/rsiCalculator';

const TOP_CRYPTOS = [
  'bitcoin',
  'ethereum',
  'cardano',
  'polkadot'
];

const MOCK_RSI_DATA = {
  bitcoin: 55,
  ethereum: 48,
  cardano: 52,
  polkadot: 45
};

export const useRSIData = () => {
  return useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      const rsiData = {};
      let delay = 0;
      
      for (const crypto of TOP_CRYPTOS) {
        try {
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          delay = 1000; // Add delay between requests to avoid rate limiting
          
          console.log(`Fetching RSI data for ${crypto}`);
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart`,
            {
              params: {
                vs_currency: 'usd',
                days: 14,
                interval: 'daily'
              },
              timeout: 5000
            }
          );
          
          if (!response.data?.prices) {
            console.error(`No price data available for ${crypto}`);
            toast.error(`Erro ao carregar dados para ${crypto}. Usando dados simulados.`);
            rsiData[crypto] = MOCK_RSI_DATA[crypto];
            continue;
          }

          const rsi = calculateRSI(response.data.prices);
          rsiData[crypto] = rsi;
          console.log(`RSI calculated for ${crypto}:`, rsi);
        } catch (error) {
          console.error(`Error calculating RSI for ${crypto}:`, error);
          toast.error(`Erro ao calcular RSI para ${crypto}. Usando dados simulados.`);
          rsiData[crypto] = MOCK_RSI_DATA[crypto];
        }
      }
      
      return rsiData;
    },
    refetchInterval: 60000,
    staleTime: 30000,
    cacheTime: 60000 * 5,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};