
import React from 'react';
import { AnimatePresence } from "framer-motion";
import { RSICard } from './RSICard';
import { LoadingRSI } from './LoadingRSI';
import { ErrorRSI } from './ErrorRSI';
import { useRSIData } from './rsi/useRSIData';
import { DCAOpportunities } from './rsi/DCAOpportunities';
import { NoDCAOpportunities } from './rsi/NoDCAOpportunities';

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error } = useRSIData();

  if (isLoading) return <LoadingRSI />;
  if (error) return <ErrorRSI />;

  // Filtra criptomoedas com RSI < 30 (possíveis oportunidades DCA)
  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, data]) => data.rsi !== null && data.rsi < 30)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([crypto, data]) => ({ id: crypto, ...data })) : [];

  // Todas as criptomoedas ordenadas por prioridade (BTC e ETH primeiro)
  const allCryptos = cryptosRSI ?
    Object.entries(cryptosRSI)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([crypto, data]) => ({ id: crypto, ...data })) : [];

  return (
    <RSICard>
      <AnimatePresence mode="wait">
        {oversoldCryptos.length > 0 ? (
          <DCAOpportunities cryptos={oversoldCryptos} />
        ) : (
          <NoDCAOpportunities cryptos={allCryptos} />
        )}
      </AnimatePresence>
    </RSICard>
  );
};

export default RSIRecommendation;
