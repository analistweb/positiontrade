import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MACDIndicator from './indicators/MACDIndicator';
import BollingerBands from './indicators/BollingerBands';
import PriceAlerts from './PriceAlerts';
import { toast } from "sonner";

const MarketAnalysis = ({ coinId = 'bitcoin' }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['marketData', coinId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`
      );
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do mercado');
      }
      
      return response.json();
    },
    refetchInterval: 60000,
    retry: 3,
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  });

  if (isLoading) {
    return <div className="animate-pulse">Carregando análise técnica...</div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar dados: {error.message}</div>;
  }

  const currentPrice = data?.prices?.[data.prices.length - 1]?.[1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MACDIndicator data={data} />
        <BollingerBands data={data} />
      </div>
      <PriceAlerts currentPrice={currentPrice} />
    </div>
  );
};

export default MarketAnalysis;