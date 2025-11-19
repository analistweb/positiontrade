import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, PieChart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, change, icon: Icon, trend, index }) => {
  const isPositive = trend === 'up';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                {title}
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                {value}
              </p>
              {change !== undefined && (
                <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span>{change}</span>
                </div>
              )}
            </div>
            <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
              isPositive 
                ? 'bg-green-500/10 text-green-500' 
                : trend === 'down'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-primary/10 text-primary'
            }`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PortfolioKPIs = ({ portfolioStats }) => {
  const {
    totalValue = 0,
    totalInvested = 0,
    totalProfitLoss = 0,
    totalProfitLossPercent = 0,
    bestPerformer = {},
    worstPerformer = {},
    change24h = 0
  } = portfolioStats || {};

  const kpis = [
    {
      title: 'Valor Total',
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}% (24h)`,
      icon: DollarSign,
      trend: change24h >= 0 ? 'up' : 'down'
    },
    {
      title: 'Lucro/Prejuízo',
      value: `${totalProfitLoss >= 0 ? '+' : ''}$${Math.abs(totalProfitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${totalProfitLossPercent >= 0 ? '+' : ''}${totalProfitLossPercent.toFixed(2)}% ROI`,
      icon: Target,
      trend: totalProfitLoss >= 0 ? 'up' : 'down'
    },
    {
      title: 'Melhor Ativo',
      value: bestPerformer.symbol ? bestPerformer.symbol.toUpperCase() : 'N/A',
      change: bestPerformer.profitPercent ? `+${bestPerformer.profitPercent.toFixed(2)}%` : undefined,
      icon: TrendingUp,
      trend: 'up'
    },
    {
      title: 'Pior Ativo',
      value: worstPerformer.symbol ? worstPerformer.symbol.toUpperCase() : 'N/A',
      change: worstPerformer.profitPercent ? `${worstPerformer.profitPercent.toFixed(2)}%` : undefined,
      icon: TrendingDown,
      trend: 'down'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} index={index} />
      ))}
    </div>
  );
};

export default PortfolioKPIs;
