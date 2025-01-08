import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon, AlertTriangleIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { RSI } from 'technicalindicators';
import { motion, AnimatePresence } from "framer-motion";
import LoadingRecommendation from './LoadingRecommendation';
import ErrorRecommendation from './ErrorRecommendation';
import CryptoList from './CryptoList';

const TOP_CRYPTOS = ['bitcoin', 'ethereum', 'babydoge', 'cardano', 'polkadot'];

const calculateRSI = (prices) => {
  if (!prices?.length || prices.length < 14) return null;
  
  try {
    const values = prices.map(price => price[1]);
    const rsiValues = RSI.calculate({
      values: values,
      period: 14 // Mantendo o período original de 14 dias
    });
    return rsiValues[rsiValues.length - 1];
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return null;
  }
};

const getCryptoName = (id) => {
  const names = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'babydoge': 'Baby Doge Coin',
    'cardano': 'Cardano',
    'polkadot': 'Polkadot'
  };
  return names[id] || id;
};

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      const rsiData = {};
      
      // Usando Promise.all para fazer todas as requisições em paralelo
      const results = await Promise.all(TOP_CRYPTOS.map(async (crypto) => {
        try {
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart`,
            {
              params: {
                vs_currency: 'usd',
                days: 14,
                interval: 'daily'
              }
            }
          );
          
          const rsi = calculateRSI(response.data?.prices);
          return { crypto, rsi };
        } catch (error) {
          console.error(`Error fetching data for ${crypto}:`, error);
          return { crypto, rsi: null };
        }
      }));
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          rsiData[result.value.crypto] = result.value.rsi;
        }
      });
      
      return rsiData;
    },
    refetchInterval: 60000, // Atualiza a cada minuto
    staleTime: 30000, // Dados considerados frescos por 30 segundos
    cacheTime: 60000 * 5, // Cache mantido por 5 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  if (isLoading) return <LoadingRecommendation />;
  if (error) return <ErrorRecommendation />;

  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi !== null && rsi < 30)
      .sort((a, b) => (a[1] || 0) - (b[1] || 0)) : [];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b border-border/10">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <TrendingUpIcon className="h-6 w-6 text-primary" />
          Recomendação DCA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 py-4"
          >
            {oversoldCryptos.length > 0 ? (
              <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                  ✨ Oportunidades de DCA Encontradas!
                </p>
                <CryptoList cryptos={oversoldCryptos} getCryptoName={getCryptoName} />
                <p className="text-sm text-green-600 dark:text-green-300 mt-4">
                  Estas criptomoedas apresentam RSI em níveis de sobre-venda, 
                  sugerindo possíveis pontos de entrada para sua estratégia DCA.
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
                  Nenhuma oportunidade encontrada
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                  O RSI não indica sobre-venda no momento para nenhuma das principais criptomoedas. 
                  Continue monitorando para melhores pontos de entrada.
                </p>
                <CryptoList 
                  cryptos={Object.entries(cryptosRSI)} 
                  getCryptoName={getCryptoName} 
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default RSIRecommendation;