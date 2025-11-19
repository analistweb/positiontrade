import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Waves, DollarSign, Activity } from 'lucide-react';
import { motion } from "framer-motion";

const WhaleActivityMetrics = ({ transactions, isLoading }) => {
  const metrics = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalVolume: 0,
        buyVolume: 0,
        sellVolume: 0,
        buyCount: 0,
        sellCount: 0,
        avgTransactionSize: 0,
        dominantTrend: 'neutral'
      };
    }

    const buyTransactions = transactions.filter(t => t.type === 'Compra');
    const sellTransactions = transactions.filter(t => t.type === 'Venda');
    
    const buyVolume = buyTransactions.reduce((sum, t) => sum + (t.volume || 0), 0);
    const sellVolume = sellTransactions.reduce((sum, t) => sum + (t.volume || 0), 0);
    const totalVolume = buyVolume + sellVolume;
    
    const avgTransactionSize = totalVolume / transactions.length;
    const buyPercentage = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;
    
    return {
      totalVolume,
      buyVolume,
      sellVolume,
      buyCount: buyTransactions.length,
      sellCount: sellTransactions.length,
      avgTransactionSize,
      dominantTrend: buyPercentage >= 55 ? 'buying' : buyPercentage <= 45 ? 'selling' : 'neutral'
    };
  }, [transactions]);

  const formatVolume = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, trend, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300">
        <div className={`absolute inset-0 opacity-5 ${
          trend === 'up' ? 'bg-gradient-to-br from-emerald-500 to-green-500' :
          trend === 'down' ? 'bg-gradient-to-br from-red-500 to-rose-500' :
          'bg-gradient-to-br from-primary to-primary'
        }`} />
        
        <CardContent className="p-4 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 sm:p-3 rounded-xl ${
              trend === 'up' ? 'bg-emerald-500/10' :
              trend === 'down' ? 'bg-red-500/10' :
              'bg-primary/10'
            }`}>
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                trend === 'up' ? 'text-emerald-500' :
                trend === 'down' ? 'text-red-500' :
                'text-primary'
              }`} />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${
                trend === 'up' ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> : 
                                   <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <MetricCard
        icon={Waves}
        title="Volume Total"
        value={formatVolume(metrics.totalVolume)}
        subtitle="Últimas 24h"
        delay={0}
      />
      
      <MetricCard
        icon={TrendingUp}
        title="Volume de Compra"
        value={formatVolume(metrics.buyVolume)}
        subtitle={`${metrics.buyCount} transações`}
        trend="up"
        delay={0.1}
      />
      
      <MetricCard
        icon={TrendingDown}
        title="Volume de Venda"
        value={formatVolume(metrics.sellVolume)}
        subtitle={`${metrics.sellCount} transações`}
        trend="down"
        delay={0.2}
      />
      
      <MetricCard
        icon={DollarSign}
        title="Média por Transação"
        value={formatVolume(metrics.avgTransactionSize)}
        subtitle="Tamanho médio"
        delay={0.3}
      />
    </div>
  );
};

export default WhaleActivityMetrics;
