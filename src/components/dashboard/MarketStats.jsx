import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Bitcoin } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { fetchMarketStats } from '../../services/marketService';

const MarketStats = () => {
  const { data: marketStats, isLoading, error } = useQuery({
    queryKey: ['marketStats'],
    queryFn: fetchMarketStats,
    refetchInterval: 60000
  });

  const formatCurrency = (value) => {
    if (!value) return 'Carregando...';
    const trillion = 1e12;
    const billion = 1e9;
    
    if (value >= trillion) {
      return `R$ ${(value / trillion).toFixed(2)} T`;
    }
    return `R$ ${(value / billion).toFixed(2)} B`;
  };

  const statCards = [
    {
      title: "Capitalização de Mercado",
      value: formatCurrency(marketStats?.totalMarketCap),
      icon: <DollarSign className="w-6 h-6 text-green-400" />,
      color: "from-green-500/20 to-green-500/5"
    },
    {
      title: "Volume 24h",
      value: formatCurrency(marketStats?.volume24h),
      icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
      color: "from-blue-500/20 to-blue-500/5"
    },
    {
      title: "Dominância do Bitcoin",
      value: isLoading ? "Carregando..." : 
             error ? "Erro" : 
             `${marketStats?.bitcoinDominance?.toFixed(2)}%`,
      icon: <Bitcoin className="w-6 h-6 text-orange-400" />,
      color: "from-orange-500/20 to-orange-500/5"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.color} border-none`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm text-gray-400">{stat.title}</h3>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default MarketStats;