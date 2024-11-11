import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinDominance, fetchPriceData } from '../services/marketService';
import SearchTrendsChart from '../components/dashboard/SearchTrendsChart';
import PriceChart from '../components/dashboard/PriceChart';
import MarketStats from '../components/dashboard/MarketStats';
import CBBIIndicator from '../components/dashboard/CBBIIndicator';
import { toast } from "sonner";

const Dashboard = () => {
  const { data: bitcoinDominance, isLoading: dominanceLoading, error: dominanceError } = useQuery({
    queryKey: ['bitcoinDominance'],
    queryFn: fetchBitcoinDominance,
    refetchInterval: 30000,
    onError: (error) => {
      toast.error(`Erro ao atualizar dominância: ${error.message}`);
    }
  });

  const { data: priceData, isLoading: priceLoading, error: priceError } = useQuery({
    queryKey: ['priceData'],
    queryFn: fetchPriceData,
    refetchInterval: 15000,
    onError: (error) => {
      toast.error(`Erro ao atualizar preços: ${error.message}`);
    }
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Painel de Criptomoedas</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketStats 
          bitcoinDominance={bitcoinDominance}
          dominanceLoading={dominanceLoading}
          dominanceError={dominanceError}
        />
        <CBBIIndicator />
      </div>
      
      <SearchTrendsChart />
      
      <PriceChart 
        data={priceData}
        isLoading={priceLoading}
        error={priceError}
      />
    </div>
  );
};

export default Dashboard;