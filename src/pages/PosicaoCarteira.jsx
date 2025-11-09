import React from 'react';
import WhaleTransactions from '../components/portfolio/WhaleTransactions';
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

const PosicaoCarteira = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Movimentações de Mercado
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Análise do comportamento dos grandes investidores
        </p>
      </div>

      {/* Whale Transactions */}
      <WhaleTransactions />
    </motion.div>
  );
};

export default PosicaoCarteira;
