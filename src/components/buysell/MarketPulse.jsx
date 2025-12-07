import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Zap,
  AlertTriangle
} from "lucide-react";

const MarketPulse = ({ rsi, volumeChange, priceChange, coin }) => {
  const getMarketMood = () => {
    if (rsi <= 30) {
      return {
        mood: 'Medo Extremo',
        description: 'Mercado em pânico - possível oportunidade de compra',
        color: 'from-buy/20 to-buy/5',
        borderColor: 'border-buy/30',
        icon: TrendingDown,
        iconColor: 'text-buy',
        action: 'COMPRA',
        actionColor: 'bg-buy/20 text-buy border-buy/30'
      };
    }
    if (rsi <= 45) {
      return {
        mood: 'Pessimismo',
        description: 'Mercado cauteloso - monitore para oportunidades',
        color: 'from-blue-500/10 to-blue-500/5',
        borderColor: 'border-blue-500/30',
        icon: Activity,
        iconColor: 'text-blue-500',
        action: 'OBSERVAR',
        actionColor: 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      };
    }
    if (rsi <= 55) {
      return {
        mood: 'Neutro',
        description: 'Mercado equilibrado - sem sinais claros',
        color: 'from-muted/20 to-muted/5',
        borderColor: 'border-border/50',
        icon: Minus,
        iconColor: 'text-muted-foreground',
        action: 'AGUARDAR',
        actionColor: 'bg-muted/20 text-muted-foreground border-border/50'
      };
    }
    if (rsi <= 70) {
      return {
        mood: 'Otimismo',
        description: 'Mercado confiante - atenção ao timing',
        color: 'from-amber-500/10 to-amber-500/5',
        borderColor: 'border-amber-500/30',
        icon: TrendingUp,
        iconColor: 'text-amber-500',
        action: 'CAUTELA',
        actionColor: 'bg-amber-500/20 text-amber-500 border-amber-500/30'
      };
    }
    return {
      mood: 'Ganância Extrema',
      description: 'Mercado eufórico - considere realizar lucros',
      color: 'from-sell/20 to-sell/5',
      borderColor: 'border-sell/30',
      icon: AlertTriangle,
      iconColor: 'text-sell',
      action: 'VENDA',
      actionColor: 'bg-sell/20 text-sell border-sell/30'
    };
  };

  const market = getMarketMood();
  const Icon = market.icon;

  const pulsePosition = Math.min(Math.max((rsi / 100) * 100, 5), 95);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className={`relative overflow-hidden bg-gradient-to-br ${market.color} ${market.borderColor}`}>
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center shadow-lg ${market.borderColor} border`}
              >
                <Icon className={`w-6 h-6 ${market.iconColor}`} />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{market.mood}</h3>
                <p className="text-sm text-muted-foreground">{market.description}</p>
              </div>
            </div>
            <Badge className={market.actionColor}>
              <Zap className="w-3 h-3 mr-1" />
              {market.action}
            </Badge>
          </div>

          {/* Pulse Bar */}
          <div className="relative">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Medo</span>
              <span>Neutro</span>
              <span>Ganância</span>
            </div>
            
            <div className="relative h-3 rounded-full bg-gradient-to-r from-buy via-muted to-sell overflow-hidden">
              <motion.div
                initial={{ left: '50%' }}
                animate={{ left: `${pulsePosition}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-5 h-5 rounded-full bg-background border-2 border-foreground shadow-lg"
                />
              </motion.div>
            </div>

            <div className="flex justify-between text-xs mt-2">
              <span className="text-buy font-medium">0</span>
              <span className="text-muted-foreground">50</span>
              <span className="text-sell font-medium">100</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="text-center p-3 rounded-xl bg-background/50 border border-border/30">
              <p className="text-2xl font-bold text-foreground">{rsi?.toFixed(0) || '--'}</p>
              <p className="text-xs text-muted-foreground">RSI Atual</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/50 border border-border/30">
              <p className={`text-2xl font-bold ${volumeChange >= 0 ? 'text-buy' : 'text-sell'}`}>
                {volumeChange >= 0 ? '+' : ''}{volumeChange?.toFixed(0) || '--'}%
              </p>
              <p className="text-xs text-muted-foreground">Volume 24h</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/50 border border-border/30">
              <p className={`text-2xl font-bold ${priceChange >= 0 ? 'text-buy' : 'text-sell'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(1) || '--'}%
              </p>
              <p className="text-xs text-muted-foreground">Preço 24h</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MarketPulse;
