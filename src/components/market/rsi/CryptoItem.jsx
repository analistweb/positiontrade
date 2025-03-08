
import React from 'react';
import { motion } from "framer-motion";

export const CryptoItem = ({ crypto }) => {
  const isHighPriority = crypto.id === 'bitcoin' || crypto.id === 'ethereum';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
        isHighPriority
          ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30'
          : 'bg-white/80 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/30'
      }`}
    >
      <span className={`font-medium ${
        isHighPriority
          ? 'text-primary'
          : 'text-gray-700 dark:text-gray-200'
      }`}>
        {crypto.name} ({crypto.symbol.toUpperCase()})
      </span>
      <div className="flex flex-col items-end">
        <span className="font-mono text-sm">
          RSI: {crypto.rsi?.toFixed(2) || 'N/A'}
        </span>
        <span className={`text-xs ${
          crypto.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {crypto.priceChange24h?.toFixed(2)}% (24h)
        </span>
      </div>
    </motion.div>
  );
};
