import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import RSICard from './indicators/RSICard';
import LoadingState from './indicators/LoadingState';
import ErrorState from './indicators/ErrorState';
import { calculateRSI } from '@/services/marketService';

const TOP_CRYPTOS = ['bitcoin', 'ethereum', 'babydoge', 'cardano', 'polkadot'];

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      const rsiData = {};
      
      const results = await Promise.allSettled(TOP_CRYPTOS.map(async (crypto) => {
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=14&interval=daily`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data?.prices) {
            console.error(`No price data available for ${crypto}`);
            return { crypto, rsi: null };
          }

          const rsi = calculateRSI(data.prices);
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
    refetchInterval: 300000,
    retry: 3,
    onError: (error) => {
      toast.error("Erro ao carregar dados do RSI. Tentando novamente...");
    }
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi !== null && rsi < 30)
      .sort((a, b) => (a[1] || 0) - (b[1] || 0)) : [];

  const getCryptoName = (id) => ({
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'babydoge': 'Baby Doge Coin',
    'cardano': 'Cardano',
    'polkadot': 'Polkadot'
  }[id] || id);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b border-border/10">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <TrendingUpIcon className="h-6 w-6 text-primary" />
          Recomendação RSI
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
            <div className="bg-card/50 p-6 rounded-lg">
              <div className="grid gap-3 md:grid-cols-2">
                {TOP_CRYPTOS.map(crypto => (
                  <RSICard
                    key={crypto}
                    crypto={getCryptoName(crypto)}
                    rsi={cryptosRSI?.[crypto]}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                O RSI é um indicador que ajuda a identificar condições de sobrecompra e sobrevenda.
                Valores abaixo de 30 podem indicar oportunidades de compra.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default RSIRecommendation;