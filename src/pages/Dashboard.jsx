import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinDominance, fetchPriceData } from '../services/marketService';
import SearchTrendsChart from '../components/dashboard/SearchTrendsChart';
import PriceChart from '../components/dashboard/PriceChart';
import MarketStats from '../components/dashboard/MarketStats';
import CBBIIndicator from '../components/dashboard/CBBIIndicator';
import { motion } from "framer-motion";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
          Painel de Criptomoedas
        </h1>
        <p className="text-gray-400">Análise em tempo real do mercado</p>
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <motion.div variants={itemVariants} className="glass-card">
          <MarketStats 
            bitcoinDominance={bitcoinDominance}
            dominanceLoading={dominanceLoading}
            dominanceError={dominanceError}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card">
          <CBBIIndicator />
        </motion.div>
      </motion.div>
      
      <motion.div variants={itemVariants} className="glass-card mb-8">
        <SearchTrendsChart />
      </motion.div>
      
      <motion.div variants={itemVariants} className="glass-card">
        <PriceChart 
          data={priceData}
          isLoading={priceLoading}
          error={priceError}
        />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;