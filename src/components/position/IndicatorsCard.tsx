import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TechnicalIndicators } from '@/services/positionAnalysis/types';

interface IndicatorsCardProps {
  indicators: TechnicalIndicators;
  currency: string;
}

export function IndicatorsCard({ indicators, currency }: IndicatorsCardProps) {
  const formatPrice = (value: number) => {
    if (isNaN(value)) return 'N/A';
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;
    return `${symbol}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRsiColor = () => {
    if (isNaN(indicators.rsi)) return 'text-muted-foreground';
    if (indicators.rsi > 70) return 'text-red-500';
    if (indicators.rsi < 30) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getRsiLabel = () => {
    if (isNaN(indicators.rsi)) return 'N/A';
    if (indicators.rsi > 70) return 'Sobrecomprado';
    if (indicators.rsi < 30) return 'Sobrevendido';
    return 'Neutro';
  };

  const getMacdColor = () => {
    if (isNaN(indicators.macd.histogram)) return 'text-muted-foreground';
    return indicators.macd.histogram > 0 ? 'text-green-500' : 'text-red-500';
  };

  const getAdxLabel = () => {
    if (isNaN(indicators.adx)) return 'N/A';
    if (indicators.adx > 40) return 'Forte';
    if (indicators.adx > 25) return 'Moderada';
    return 'Fraca';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <BarChart3 className="h-4 w-4" />
            Indicadores Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Médias Móveis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SMA 50</p>
              <p className="text-lg font-semibold">{formatPrice(indicators.sma50)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SMA 200</p>
              <p className="text-lg font-semibold">{formatPrice(indicators.sma200)}</p>
            </div>
          </div>

          {/* RSI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">RSI (14)</span>
              <span className={`text-sm font-medium ${getRsiColor()}`}>
                {isNaN(indicators.rsi) ? 'N/A' : indicators.rsi.toFixed(1)} - {getRsiLabel()}
              </span>
            </div>
            <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30"
                style={{ width: '100%' }}
              />
              {!isNaN(indicators.rsi) && (
                <div 
                  className="absolute top-0 h-full w-1 bg-foreground rounded"
                  style={{ left: `${Math.min(100, indicators.rsi)}%`, transform: 'translateX(-50%)' }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Sobrevendido</span>
              <span>30</span>
              <span>50</span>
              <span>70</span>
              <span>Sobrecomprado</span>
            </div>
          </div>

          {/* MACD */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">MACD</p>
              <p className={`text-sm font-medium ${getMacdColor()}`}>
                {isNaN(indicators.macd.line) ? 'N/A' : indicators.macd.line.toFixed(3)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="text-sm font-medium">
                {isNaN(indicators.macd.signal) ? 'N/A' : indicators.macd.signal.toFixed(3)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Histograma</p>
              <p className={`text-sm font-medium ${getMacdColor()}`}>
                {isNaN(indicators.macd.histogram) ? 'N/A' : indicators.macd.histogram.toFixed(3)}
              </p>
            </div>
          </div>

          {/* ATR e ADX */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                ATR (Volatilidade)
              </p>
              <p className="text-sm font-medium">
                {isNaN(indicators.atr) ? 'N/A' : formatPrice(indicators.atr)}
                <span className="text-xs text-muted-foreground ml-1">
                  ({isNaN(indicators.atrPercent) ? 'N/A' : indicators.atrPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                ADX (Força Tendência)
              </p>
              <p className="text-sm font-medium">
                {isNaN(indicators.adx) ? 'N/A' : indicators.adx.toFixed(1)}
                <span className="text-xs text-muted-foreground ml-1">
                  ({getAdxLabel()})
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
