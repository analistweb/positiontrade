import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, AlertTriangleIcon, LoaderIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { RSI } from 'technicalindicators';
import { motion, AnimatePresence } from "framer-motion";

const TOP_CRYPTOS = [
  'bitcoin',
  'ethereum',
  'babydoge',
  'cardano',
  'polkadot'
];

const calculateRSI = (prices) => {
  if (!prices || !Array.isArray(prices)) return null;
  const values = prices.map(price => price[1]);
  const rsiValues = RSI.calculate({
    values: values,
    period: 14
  });
  return rsiValues[rsiValues.length - 1];
};

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error, isError } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      const rsiData = {};
      
      await Promise.all(TOP_CRYPTOS.map(async (crypto) => {
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
          
          const rsi = calculateRSI(response.data.prices);
          rsiData[crypto] = rsi;
        } catch (error) {
          console.error(`Erro ao buscar dados para ${crypto}:`, error);
          rsiData[crypto] = null;
        }
      }));
      
      return rsiData;
    },
    refetchInterval: 300000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi && rsi < 30)
      .sort((a, b) => a[1] - b[1]) : [];

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            Recomendação DCA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <LoaderIcon className="h-8 w-8 text-primary" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            Erro ao Carregar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as recomendações. Por favor, tente novamente mais tarde.
          </p>
        </CardContent>
      </Card>
    );
  }

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
              <>
                <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                    ✨ Oportunidades de DCA Encontradas!
                  </p>
                  <div className="mt-4 space-y-3">
                    {oversoldCryptos.map(([crypto, rsi]) => (
                      <motion.div
                        key={crypto}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg"
                      >
                        <span className="text-green-700 dark:text-green-300 font-medium">
                          {getCryptoName(crypto)}
                        </span>
                        <Badge variant="secondary" className="font-mono">
                          RSI: {rsi?.toFixed(2) || 'N/A'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-4">
                    Estas criptomoedas apresentam RSI em níveis de sobre-venda, 
                    sugerindo possíveis pontos de entrada para sua estratégia DCA.
                  </p>
                </div>
              </>
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
                <div className="mt-4 space-y-3">
                  {TOP_CRYPTOS.map(crypto => (
                    <motion.div
                      key={crypto}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center p-3 bg-white/80 dark:bg-black/20 rounded-lg hover:bg-white/90 dark:hover:bg-black/30 transition-colors"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {getCryptoName(crypto)}
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        RSI: {cryptosRSI?.[crypto]?.toFixed(2) || 'N/A'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default RSIRecommendation;