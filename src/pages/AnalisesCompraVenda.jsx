
import React from 'react';
import { motion } from "framer-motion";
import useMarketAnalysis from '../hooks/useMarketAnalysis';
import PageHeader from '../components/analysis/PageHeader';
import FilterControls from '../components/analysis/FilterControls';
import LoadingState from '../components/analysis/LoadingState';
import ErrorState from '../components/analysis/ErrorState';
import DataVisualizations from '../components/analysis/DataVisualizations';

const AnalisesCompraVenda = () => {
  const {
    marketData,
    isLoading,
    error,
    topCoins,
    isLoadingCoins,
    selectedCoin,
    setSelectedCoin,
    selectedDays,
    setSelectedDays,
    minVolume,
    setMinVolume,
    currentRSI,
    handleRefresh
  } = useMarketAnalysis();

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (error && !marketData) {
      return <ErrorState error={error} handleRefresh={handleRefresh} />;
    }

    return (
      <DataVisualizations 
        marketData={marketData}
        minVolume={minVolume}
        currentRSI={currentRSI}
        selectedCoin={selectedCoin}
        handleRefresh={handleRefresh}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader 
        handleRefresh={handleRefresh}
        marketData={marketData}
      />
      
      <FilterControls 
        selectedCoin={selectedCoin}
        setSelectedCoin={setSelectedCoin}
        selectedDays={selectedDays}
        setSelectedDays={setSelectedDays}
        minVolume={minVolume}
        setMinVolume={setMinVolume}
        topCoins={topCoins}
        isLoadingCoins={isLoadingCoins}
      />

      {renderContent()}
    </div>
  );
};

export default AnalisesCompraVenda;
