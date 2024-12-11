import { useQuery } from '@tanstack/react-query';
import { fetchMarketData } from '@/services/marketService';
import { toast } from "sonner";

export const useMarketData = (coinId: string, days: number) => {
  return useQuery({
    queryKey: ['marketData', coinId, days],
    queryFn: () => fetchMarketData(coinId, days),
    refetchInterval: 30000,
    onError: (error: Error) => {
      toast.error(`Erro ao carregar dados do mercado: ${error.message}`);
    }
  });
};