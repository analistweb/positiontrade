
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
              timeout: 10000 // Aumentar o timeout para 10 segundos
            }
          );
          
          if (!response.data?.prices) {
            console.error(`No price data available for ${crypto}`);
            throw new Error(`Dados não disponíveis para ${crypto}`);
          }

          const rsi = calculateRSI(response.data.prices);
          rsiData[crypto] = rsi;
          console.log(`RSI calculated for ${crypto}:`, rsi);
        } catch (error) {
          console.error(`Error calculating RSI for ${crypto}:`, error);
          toast.error(`Erro ao calcular RSI para ${crypto}`);
          throw error;
        }
      }
      
      if (Object.keys(rsiData).length === 0) {
        throw new Error("Não foi possível obter dados reais de RSI");
      }
      
      return rsiData;
    },
    refetchInterval: 300000, // 5 minutos
    staleTime: 240000, // 4 minutos
    cacheTime: 60000 * 5, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};
