import React from 'react';
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const SentimentIndicator = ({ indicator, index }) => {
  const getSentimentIcon = (status) => {
    switch (status) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card/50 p-4 rounded-lg border border-border/50"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{indicator.name}</span>
        {getSentimentIcon(indicator.status)}
      </div>
      <span className="text-xl font-semibold text-foreground mb-2">{indicator.value}</span>
      <p className="text-sm text-muted-foreground mt-2">{indicator.description}</p>
    </motion.div>
  );
};

export default SentimentIndicator;