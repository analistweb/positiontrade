import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinDominance } from '@/services/marketService';
import { toast } from "sonner";

export const useBitcoinDominance = () => {
  return useQuery({
    queryKey: ['bitcoinDominance'],
    queryFn: fetchBitcoinDominance,
    refetchInterval: 30000,
    onError: (error: Error) => {
      toast.error(`Erro ao carregar dominância do Bitcoin: ${error.message}`);
    }
  });
};