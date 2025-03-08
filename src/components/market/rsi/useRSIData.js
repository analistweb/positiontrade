
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';
import { toast } from "sonner";
import { calculateRSI } from '@/utils/rsiCalculator';
import { FOCUSED_CRYPTOS } from './constants';

export const useRSIData = () => {
  return useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      try {
        // Buscar dados apenas para as criptomoedas específicas
        const cryptoIds = FOCUSED_CRYPTOS.map(crypto => crypto.id).join(',');
        
        const response = await axios.get(
          `${COINGECKO_API_URL}/coins/markets`,
          {
            params: {
              vs_currency: 'usd',
              ids: cryptoIds,
              order: 'market_cap_desc',
              per_page: 10,
              sparkline: true,
              price_change_percentage: '24h'
            },
            headers: getHeaders()
          }
        );

        if (!response.data) {
          throw new Error('Dados RSI não disponíveis');
        }

        const rsiData = {};
        
        // Utiliza a função rsiCalculator para calcular o RSI de cada criptomoeda
        response.data.forEach(coin => {
          if (coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
            // Formata os dados para o cálculo do RSI (converte para o formato [timestamp, price])
            const prices = coin.sparkline_in_7d.price.map((price, index) => 
              [Date.now() - (168 - index) * 3600000, price]
            );
            
            // Calcula o RSI usando a função importada
            const rsi = calculateRSI(prices);
            
            // Armazena o resultado
            rsiData[coin.id] = {
              rsi: rsi,
              name: coin.name,
              symbol: coin.symbol,
              price: coin.current_price,
              priceChange24h: coin.price_change_percentage_24h,
              priority: FOCUSED_CRYPTOS.find(c => c.id === coin.id)?.priority || 99
            };
          }
        });

        console.log('RSI data calculated for focused cryptos:', rsiData);
        return rsiData;
      } catch (error) {
        console.error('Error calculating RSI for focused cryptos:', error);
        toast.error('Erro ao calcular RSI para as criptomoedas selecionadas');
        throw error;
      }
    },
    refetchInterval: 300000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onError: (error) => {
      console.error('Error in RSI query:', error);
    }
  });
};
