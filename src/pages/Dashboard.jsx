import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { fetchBitcoinDominance } from '../services/analysis/sentimentService';
import MarketStats from '../components/dashboard/MarketStats';
import CBBIIndicator from '../components/dashboard/CBBIIndicator';
import MarketSentiment from '../components/dashboard/MarketSentiment';
import MarketHeatmap from '../components/dashboard/MarketHeatmap';
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
        className="mb-8 glass-morphism p-8 rounded-2xl"
      >
        <h1 className="text-5xl font-bold gradient-text mb-4">
          Painel de Criptomoedas
        </h1>
        <p className="text-gray-400 text-lg mb-4">
          Análise em tempo real do mercado com tecnologia avançada
        </p>
        <div className="flex gap-4 items-center text-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/40">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400">Dados Reais da API</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 rounded-full border border-gray-500/40">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-400">Dados Simulados</span>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <motion.div 
          variants={itemVariants} 
          className="glass-morphism rounded-2xl p-6 card-hover"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-400" />
              <h2 className="text-2xl font-semibold neon-glow">Estatísticas do Mercado</h2>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/40">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">API Real</span>
            </div>
          </div>
          <MarketStats 
            bitcoinDominance={bitcoinDominance}
            dominanceLoading={dominanceLoading}
            dominanceError={dominanceError}
          />
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="glass-morphism rounded-2xl p-6 card-hover"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Globe className="w-6 h-6 mr-2 text-purple-400" />
              <h2 className="text-2xl font-semibold neon-glow">Indicador CBBI</h2>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/40">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">API Real</span>
            </div>
          </div>
          <CBBIIndicator />
        </motion.div>
      </motion.div>
      
      <motion.div 
        variants={itemVariants} 
        className="glass-morphism rounded-2xl p-6 mb-8 card-hover"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Brain className="w-6 h-6 mr-2 text-green-400" />
            <h2 className="text-2xl font-semibold neon-glow">Análise de Sentimento</h2>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/40">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">API Real</span>
          </div>
        </div>
        <MarketSentiment />
      </motion.div>
      
      <motion.div 
        variants={itemVariants} 
        className="glass-morphism rounded-2xl p-6 card-hover"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Flame className="w-6 h-6 mr-2 text-orange-400" />
            <h2 className="text-2xl font-semibold neon-glow">Mapa de Calor do Mercado</h2>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/40">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">API Real</span>
          </div>
        </div>
        <MarketHeatmap />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
