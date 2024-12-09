import { useQuery } from '@tanstack/react-query';
import { fetchMarketData } from '@/services/marketService';
import { toast } from "sonner";

export const useMarketData = (coinId, days) => {
  return useQuery({
    queryKey: ['marketData', coinId, days],
    queryFn: () => fetchMarketData(coinId, days),
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    onSuccess: () => {
      toast.success('Dados atualizados com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao buscar dados: ${error.message}`);
    }
  });
};