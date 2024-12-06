import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import { motion } from "framer-motion";
import AnaliseIndicadores from '../components/risco-oportunidade/AnaliseIndicadores';
import AnaliseSentimento from '../components/risco-oportunidade/AnaliseSentimento';
import LoadingCard from '../components/risco-oportunidade/LoadingCard';

const RiscoOportunidade = () => {
  const { data: fundamentalData, isLoading: fundamentalLoading } = useQuery({
    queryKey: ['bitcoinFundamentals'],
    queryFn: async () => {
      try {
        // Dados simulados - em produção, viriam de uma API real
        return {
          hashrate: {
            current: 512,
            previous: 490,
            trend: 'up'
          },
          transactions: {
            current: 350000,
            previous: 320000,
            trend: 'up'
          },
          lastUpdate: new Date().toISOString()
        };
      } catch (error) {
        toast.error("Erro ao carregar dados fundamentalistas");
        throw error;
      }
    },
    refetchInterval: 300000 // 5 minutos
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['marketNews'],
    queryFn: async () => {
      try {
        // Dados simulados - em produção, viriam de uma API de notícias
        return {
          headlines: [
            {
              title: "Bitcoin atinge nova máxima histórica",
              sentiment: "positive",
              date: new Date().toISOString()
            },
            {
              title: "Mercado cripto mostra resiliência",
              sentiment: "positive",
              date: new Date().toISOString()
            }
          ],
          sentimentScore: 75
        };
      } catch (error) {
        toast.error("Erro ao carregar notícias do mercado");
        throw error;
      }
    },
    refetchInterval: 300000
  });

  if (fundamentalLoading || newsLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Análise de Risco e Oportunidade</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6"
      >
        Análise de Risco e Oportunidade
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnaliseSentimento newsData={newsData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AnaliseIndicadores fundamentalData={fundamentalData} />
        </motion.div>
      </div>
    </div>
  );
};

export default RiscoOportunidade;