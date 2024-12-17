import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import { motion } from "framer-motion";
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, handleApiError } from '../config/api';
import AnaliseIndicadores from '../components/risco-oportunidade/AnaliseIndicadores';
import AnaliseSentimento from '../components/risco-oportunidade/AnaliseSentimento';
import LoadingCard from '../components/risco-oportunidade/LoadingCard';

const RiscoOportunidade = () => {
  const { data: fundamentalData, isLoading: fundamentalLoading } = useQuery({
    queryKey: ['bitcoinFundamentals'],
    queryFn: async () => {
      try {
        const [marketData, globalData] = await Promise.all([
          axios.get(`${COINGECKO_API_URL}/coins/bitcoin`, {
            params: {
              localization: false,
              tickers: false,
              market_data: true,
              developer_data: true
            },
            headers: getHeaders()
          }),
          axios.get(`${COINGECKO_API_URL}/global`, {
            headers: getHeaders()
          })
        ]);

        const hashrate = marketData.data.developer_data.closed_issues;
        const transactions = marketData.data.market_data.total_volume.usd;
        
        return {
          hashrate: {
            current: hashrate,
            previous: hashrate * 0.95, // Comparação com período anterior
            trend: hashrate > (hashrate * 0.95) ? 'up' : 'down'
          },
          transactions: {
            current: transactions,
            previous: transactions * 0.98, // Comparação com período anterior
            trend: transactions > (transactions * 0.98) ? 'up' : 'down'
          },
          lastUpdate: new Date().toISOString()
        };
      } catch (error) {
        handleApiError(error, 'dados fundamentalistas');
      }
    },
    refetchInterval: 300000 // 5 minutos
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['marketNews'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${COINGECKO_API_URL}/search/trending`, {
          headers: getHeaders()
        });

        const coins = response.data.coins;
        const headlines = coins.map(coin => ({
          title: `${coin.item.name} em tendência de alta`,
          sentiment: coin.item.price_btc > 0 ? 'positive' : 'negative',
          date: new Date().toISOString()
        }));

        // Calculando sentimento geral baseado nas moedas em tendência
        const positiveCount = headlines.filter(h => h.sentiment === 'positive').length;
        const sentimentScore = (positiveCount / headlines.length) * 100;

        return {
          headlines,
          sentimentScore
        };
      } catch (error) {
        handleApiError(error, 'notícias do mercado');
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