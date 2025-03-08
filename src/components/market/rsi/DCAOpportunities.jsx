
import React from 'react';
import { Bitcoin } from "lucide-react";
import { CryptoItem } from './CryptoItem';

export const DCAOpportunities = ({ cryptos }) => {
  if (!cryptos || cryptos.length === 0) return null;
  
  return (
    <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
      <p className="text-green-800 dark:text-green-200 font-semibold text-lg flex items-center gap-2">
        <Bitcoin className="h-5 w-5" />
        Oportunidades de DCA Encontradas!
      </p>
      
      <div className="mt-4 space-y-3">
        {cryptos.map(crypto => (
          <CryptoItem key={crypto.id} crypto={crypto} />
        ))}
      </div>
      
      <p className="text-sm text-green-600 dark:text-green-300 mt-4">
        Estas criptomoedas apresentam RSI em níveis de sobre-venda, 
        sugerindo possíveis pontos de entrada para sua estratégia DCA.
      </p>
    </div>
  );
};
