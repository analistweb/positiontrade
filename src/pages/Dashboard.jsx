import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { fetchBitcoinDominance } from '../services/analysis/sentimentService';
import MarketStats from '../components/dashboard/MarketStats';
import CBBIIndicator from '../components/dashboard/CBBIIndicator';
import MarketSentiment from '../components/dashboard/MarketSentiment';
import MarketHeatmap from '../components/dashboard/MarketHeatmap';
import { DataSourceLegend, DataSourceBadge } from '../components/common/DataSourceBadge';
import { toast } from "sonner";
import { Activity, Globe, Brain, Flame } from "lucide-react";

const Dashboard = () => {
  const { data: bitcoinDominance, isLoading: dominanceLoading, error: dominanceError } = useQuery({
    queryKey: ['bitcoinDominance'],
    queryFn: fetchBitcoinDominance,
    refetchInterval: 30000,
    onError: (error) => {
      toast.error(`Erro ao atualizar dominância: ${error.message}`);
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen animated-bg p-6 text-white"
    >
      <motion.div 
        variants={itemVariants} 
        className="glass-morphism rounded-2xl p-8"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Painel de Criptomoedas
        </h1>
        <p className="text-gray-400 text-base sm:text-lg mb-4">
          Análise em tempo real do mercado com tecnologia avançada
        </p>
        <DataSourceLegend />
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <motion.div 
          variants={itemVariants} 
          className="glass-morphism rounded-2xl p-6 card-hover border border-border/30 hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/10 rounded-xl mr-3">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold">Estatísticas do Mercado</h2>
            </div>
            <DataSourceBadge isRealData={true} size="sm" />
          </div>
          <MarketStats 
            bitcoinDominance={bitcoinDominance}
            dominanceLoading={dominanceLoading}
            dominanceError={dominanceError}
          />
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="glass-morphism rounded-2xl p-6 card-hover border border-border/30 hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/10 rounded-xl mr-3">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold">Indicador CBBI</h2>
            </div>
            <DataSourceBadge isRealData={true} size="sm" />
          </div>
          <CBBIIndicator />
        </motion.div>
      </motion.div>
      
      <motion.div 
        variants={itemVariants} 
        className="glass-morphism rounded-2xl p-6 mb-8 card-hover border border-border/30 hover:border-primary/30 transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/10 rounded-xl mr-3">
              <Brain className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold">Análise de Sentimento</h2>
          </div>
          <DataSourceBadge isRealData={true} size="sm" />
        </div>
        <MarketSentiment />
      </motion.div>
      
      <motion.div 
        variants={itemVariants} 
        className="glass-morphism rounded-2xl p-6 card-hover border border-border/30 hover:border-primary/30 transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-orange-500/10 rounded-xl mr-3">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold">Mapa de Calor do Mercado</h2>
          </div>
          <DataSourceBadge isRealData={true} size="sm" />
        </div>
        <MarketHeatmap />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
