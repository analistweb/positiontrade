import React from 'react';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const CryptoList = ({ cryptos, getCryptoName }) => (
  <div className="mt-4 space-y-3">
    {cryptos.map(([crypto, rsi]) => (
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
);

export default CryptoList;