import React from 'react';
import WhaleTransactions from '../components/portfolio/WhaleTransactions';
import WhaleActivityMetrics from '../components/portfolio/WhaleActivityMetrics';
import WhaleVolumeChart from '../components/portfolio/WhaleVolumeChart';
import TopWhaleMovements from '../components/portfolio/TopWhaleMovements';
import { motion } from "framer-motion";
import { Waves } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { fetchWhaleTransactions } from '@/services/marketService';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const PosicaoCarteira = () => {
  const { 
    data: transactions, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['whaleTransactions', '7d'],
    queryFn: () => fetchWhaleTransactions('7d'),
    refetchInterval: 300000,
    staleTime: 240000,
    retry: 2,
    onError: (err) => {
      console.error('Erro ao carregar transações de baleias:', err);
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Carregando dados reais de transações de baleias..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorDisplay 
          message="Erro ao carregar dados reais da API CoinGecko" 
          details={error.message}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 sm:p-8 border border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 sm:p-4 rounded-2xl bg-primary/10 backdrop-blur-sm">
              <Waves className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2">
                Atividade das Baleias
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Monitoramento em tempo real dos grandes investidores
              </p>
            </div>
          </div>
          <DataSourceBadge isRealData={true} size="md" />
        </div>
      </div>

      {/* Activity Metrics */}
      <WhaleActivityMetrics transactions={transactions} isLoading={isLoading} />

      {/* Whale Sentiment Cards (BTC & ETH) */}
      <WhaleTransactions />

      {/* Volume Chart */}
      <WhaleVolumeChart transactions={transactions} isLoading={isLoading} />

      {/* Top Movements */}
      <TopWhaleMovements transactions={transactions} isLoading={isLoading} />
    </motion.div>
  );
};

export default PosicaoCarteira;
