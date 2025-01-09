import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { CryptoList } from './CryptoList';
import { RSICard } from './RSICard';
import { LoadingRSI } from './LoadingRSI';
import { ErrorRSI } from './ErrorRSI';
import { useRSIData } from '../../hooks/useRSIData';

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error, isError } = useRSIData();

  if (isLoading) {
    return <LoadingRSI />;
  }

  if (isError) {
    return <ErrorRSI />;
  }

  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi !== null && rsi < 30)
      .sort((a, b) => (a[1] || 0) - (b[1] || 0))
      .map(([crypto]) => crypto) : [];

  return (
    <RSICard>
      <AnimatePresence mode="wait">
        {oversoldCryptos.length > 0 ? (
          <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
              ✨ Oportunidades de DCA Encontradas!
            </p>
            <CryptoList cryptos={oversoldCryptos} rsiData={cryptosRSI} />
            <p className="text-sm text-green-600 dark:text-green-300 mt-4">
              Estas criptomoedas apresentam RSI em níveis de sobre-venda, 
              sugerindo possíveis pontos de entrada para sua estratégia DCA.
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Nenhuma oportunidade encontrada
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
              O RSI não indica sobre-venda no momento para nenhuma das principais criptomoedas. 
              Continue monitorando para melhores pontos de entrada.
            </p>
            <CryptoList 
              cryptos={Object.keys(cryptosRSI || {})} 
              rsiData={cryptosRSI} 
            />
          </div>
        )}
      </AnimatePresence>
    </RSICard>
  );
};

export default RSIRecommendation;