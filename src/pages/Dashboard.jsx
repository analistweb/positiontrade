import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinDominance, fetchPriceData } from '../services/marketService';
import SearchTrendsChart from '../components/dashboard/SearchTrendsChart';
import PriceChart from '../components/dashboard/PriceChart';
import MarketStats from '../components/dashboard/MarketStats';

const Dashboard = () => {
  const { data: bitcoinDominance, isLoading: dominanceLoading, error: dominanceError } = useQuery({
    queryKey: ['bitcoinDominance'],
    queryFn: fetchBitcoinDominance,
    refetchInterval: 300000,
  });

  const { data: priceData, isLoading: priceLoading, error: priceError } = useQuery({
    queryKey: ['priceData'],
    queryFn: fetchPriceData,
    refetchInterval: 300000,
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Painel de Criptomoedas</h1>
      
      <MarketStats 
        bitcoinDominance={bitcoinDominance}
        dominanceLoading={dominanceLoading}
        dominanceError={dominanceError}
      />
      
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