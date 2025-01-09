import React from 'react';
import { AlertTriangleIcon, LoaderIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { RSI } from 'technicalindicators';
import { motion, AnimatePresence } from "framer-motion";
import { RSICard } from './RSICard';
import { CryptoList } from './CryptoList';
import { toast } from "sonner";

const TOP_CRYPTOS = [
  'bitcoin',
  'ethereum',
  'cardano',
  'polkadot'
];

const calculateRSI = (prices) => {
  if (!prices || !Array.isArray(prices) || prices.length < 14) {
    console.log('Invalid price data for RSI calculation:', prices);
    return null;
  }
  
  try {
    const values = prices.map(price => price[1]);
    const rsiValues = RSI.calculate({
      values: values,
      period: 14
    });
    return rsiValues[rsiValues.length - 1];
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return null;
  }
};

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error, isError } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      const rsiData = {};
      let delay = 0;
      
      for (const crypto of TOP_CRYPTOS) {
        try {
          // Add delay between requests to avoid rate limiting
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          delay = 1000; // 1 second delay between requests
          
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
          
          if (!response.data?.prices) {
            console.error(`No price data available for ${crypto}`);
            toast.error(`Erro ao carregar dados para ${crypto}`);
            rsiData[crypto] = null;
            continue;
          }

          const rsi = calculateRSI(response.data.prices);
          rsiData[crypto] = rsi;
        } catch (error) {
          console.error(`Error fetching data for ${crypto}:`, error);
          toast.error(`Erro ao carregar dados para ${crypto}`);
          rsiData[crypto] = null;
        }
      }
      
      return rsiData;
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    staleTime: 30000, // Considera os dados obsoletos após 30 segundos
    cacheTime: 60000 * 5, // Mantém no cache por 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi !== null && rsi < 30)
      .sort((a, b) => (a[1] || 0) - (b[1] || 0)) : [];

  if (isLoading) {
    return (
      <RSICard>
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <LoaderIcon className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
      </RSICard>
    );
  }

  if (isError) {
    return (
      <RSICard>
        <div className="bg-destructive/10 p-6 rounded-lg">
          <p className="text-destructive flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5" />
            Erro ao carregar dados. Tentando novamente em alguns segundos...
          </p>
        </div>
      </RSICard>
    );
  }

  return (
    <RSICard>
      <AnimatePresence mode="wait">
        {oversoldCryptos.length > 0 ? (
          <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
              ✨ Oportunidades de DCA Encontradas!
            </p>
            <CryptoList cryptos={oversoldCryptos.map(([crypto]) => crypto)} rsiData={cryptosRSI} />
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
            <CryptoList cryptos={TOP_CRYPTOS} rsiData={cryptosRSI} />
          </div>
        )}
      </AnimatePresence>
    </RSICard>
  );
};

export default RSIRecommendation;