import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Zap, BarChart3, Clock } from 'lucide-react';

const StrategyMetrics = ({ signals, successfulSignals }) => {
  // Total de sinais gerados
  const totalSignals = signals.length;
  
  // Total de sinais FECHADOS (TP + SL)
  const closedSignals = successfulSignals.length;
  
  // Sinais que atingiram TP (sucesso)
  const successfulCount = successfulSignals.filter(s => s.status === 'SUCESSO').length;
  
  // Taxa de sucesso = (sinais com TP / sinais fechados) * 100
  const successRate = closedSignals > 0 ? ((successfulCount / closedSignals) * 100).toFixed(1) : 0;
  
  // Lucro médio APENAS dos sinais bem-sucedidos (TP)
  const avgProfit = successfulCount > 0
    ? (successfulSignals
        .filter(s => s.status === 'SUCESSO')
        .reduce((sum, s) => sum + parseFloat(s.profit || 0), 0) / successfulCount).toFixed(2)
    : 0;

  const buySignals = signals.filter(s => s.type === 'COMPRA').length;
  const sellSignals = signals.filter(s => s.type === 'VENDA').length;

  const metrics = [
    {
      label: 'Taxa de Sucesso',
      value: `${successRate}%`,
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: successRate >= 60 ? 'up' : 'down'
    },
    {
      label: 'Lucro Médio',
      value: `${avgProfit}%`,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: avgProfit > 0 ? 'up' : 'down'
    },
    {
      label: 'Total de Sinais',
      value: totalSignals,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      subValue: `${closedSignals} fechados`
    },
    {
      label: 'Compra vs Venda',
      value: `${buySignals}/${sellSignals}`,
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      subValue: 'Operações'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`${metric.bgColor} p-2 sm:p-2.5 rounded-lg`}>
                  <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.color}`} />
                </div>
                {metric.trend && (
                  metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  {metric.label}
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                  {metric.value}
                </p>
                {metric.subValue && (
                  <p className="text-xs text-muted-foreground">
                    {metric.subValue}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StrategyMetrics;
