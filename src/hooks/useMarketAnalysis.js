
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketData, fetchTopCoins } from '../services/marketService';
import { toast } from "sonner";
import { RSI } from 'technicalindicators';

export const useMarketAnalysis = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(90);
  const [minVolume, setMinVolume] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(50);

  // Consulta para obter dados de mercado
  const { 
    data: marketData, 
    isLoading, 
    error,
    refetch: refetchMarketData
  } = useQuery({
    queryKey: ['marketData', selectedCoin, selectedDays],
    queryFn: () => fetchMarketData(selectedCoin, selectedDays),
    refetchInterval: 300000,
    retry: 3,
    onError: (error) => {
      toast.error(`Erro ao buscar dados: ${error.message}`);
    }
  });

  // Consulta para obter as principais criptomoedas
  const { 
    data: topCoins,
    isLoading: isLoadingCoins,
    error: coinsError,
    refetch: refetchCoins
  } = useQuery({
    queryKey: ['topCoins'],
    queryFn: fetchTopCoins,
    refetchInterval: 300000,
    retry: 3
  });

  // Calcula o RSI quando os dados de mercado mudam
  useEffect(() => {
    if (marketData?.prices && marketData.prices.length > 0) {
      const prices = marketData.prices.map(price => price[1]);
      try {
        const rsiValues = RSI.calculate({ values: prices, period: 14 });
        if (rsiValues && rsiValues.length > 0) {
          setCurrentRSI(rsiValues[rsiValues.length - 1]);
        }
      } catch (err) {
        console.error("Error calculating RSI:", err);
      }
    }
  }, [marketData]);

  // Função para atualizar os dados
  const handleRefresh = useCallback(() => {
    refetchMarketData();
    refetchCoins();
    toast.success("Recarregando dados...");
  }, [refetchMarketData, refetchCoins]);

  return {
    marketData,
    isLoading,
    error,
    topCoins,
    isLoadingCoins,
    coinsError,
    selectedCoin,
    setSelectedCoin,
    selectedDays,
    setSelectedDays,
    minVolume,
    setMinVolume,
    currentRSI,
    handleRefresh
  };
};

export default useMarketAnalysis;
