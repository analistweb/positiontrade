
import React from 'react';
import { AlertTriangle } from "lucide-react";
import { CryptoItem } from './CryptoItem';

export const NoDCAOpportunities = ({ cryptos }) => {
  if (!cryptos || cryptos.length === 0) return null;
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg">
      <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        Nenhuma oportunidade DCA encontrada
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
        O RSI não indica sobre-venda no momento para as criptomoedas selecionadas. 
        Continue monitorando para melhores pontos de entrada.
      </p>
      
      <div className="mt-4 space-y-3">
        {cryptos.map(crypto => (
          <CryptoItem key={crypto.id} crypto={crypto} />
        ))}
      </div>
    </div>
  );
};
