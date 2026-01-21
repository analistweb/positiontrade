import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TrendAnalysis } from '@/services/positionAnalysis/types';

interface TrendCardProps {
  trend: TrendAnalysis;
  currentPrice: number;
  currency: string;
}

export function TrendCard({ trend, currentPrice, currency }: TrendCardProps) {
  const getTrendIcon = () => {
    switch (trend.label) {
      case 'Alta':
        return <TrendingUp className="h-8 w-8" />;
      case 'Baixa':
        return <TrendingDown className="h-8 w-8" />;
      default:
        return <Minus className="h-8 w-8" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.label) {
      case 'Alta':
        return 'text-green-500';
      case 'Baixa':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getTrendBg = () => {
    switch (trend.label) {
      case 'Alta':
        return 'from-green-500/20 to-green-500/5';
      case 'Baixa':
        return 'from-red-500/20 to-red-500/5';
      default:
        return 'from-yellow-500/20 to-yellow-500/5';
    }
  };

  const formatCurrency = (value: number) => {
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;
    return `${symbol}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden bg-gradient-to-br ${getTrendBg()} border-border/50`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Tendência Macro
            </span>
            <Badge variant="outline" className="text-xs">
              Força: {trend.strength}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`${getTrendColor()}`}>
              {getTrendIcon()}
            </div>
            <div className="flex-1">
              <p className={`text-3xl font-bold ${getTrendColor()}`}>
                {trend.label.toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(currentPrice)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {trend.justificativa}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <Badge 
              variant={trend.sma50AboveSma200 ? 'default' : 'secondary'}
              className="text-xs"
            >
              SMA50 {trend.sma50AboveSma200 ? '>' : '<'} SMA200
            </Badge>
            <Badge 
              variant={trend.priceAboveSma200 ? 'default' : 'secondary'}
              className="text-xs"
            >
              Preço {trend.priceAboveSma200 ? 'acima' : 'abaixo'} SMA200
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
