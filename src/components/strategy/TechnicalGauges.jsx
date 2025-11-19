import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Volume2 } from 'lucide-react';

const GaugeChart = ({ value, max, label, color, icon: Icon }) => {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-20 sm:w-40 sm:h-24">
        {/* Background arc */}
        <svg className="absolute inset-0" viewBox="0 0 160 100">
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/30"
          />
          {/* Colored arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={`${percentage * 1.88} 188`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Needle */}
        <div 
          className="absolute left-1/2 bottom-2 w-1 h-14 sm:h-16 origin-bottom -ml-0.5 transition-transform duration-500"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className={`w-full h-full ${color} rounded-full`} style={{ background: color }} />
        </div>
        {/* Center dot */}
        <div className="absolute left-1/2 bottom-2 w-3 h-3 -ml-1.5 -mb-1.5 rounded-full bg-foreground" />
      </div>
      <div className="text-center mt-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-xl sm:text-2xl font-bold">{value.toFixed(1)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

const TechnicalGauges = ({ conditionsStatus }) => {
  if (!conditionsStatus) return null;

  const volumeRatio = conditionsStatus.currentVolume / conditionsStatus.avgVolume;
  const volumePercentage = Math.min(volumeRatio * 100, 200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Indicadores Técnicos em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <GaugeChart
              value={conditionsStatus.adx}
              max={100}
              label="ADX (Força da Tendência)"
              color="#10b981"
              icon={TrendingUp}
            />
            <GaugeChart
              value={conditionsStatus.atrValue}
              max={conditionsStatus.atrValue * 2}
              label="ATR (Volatilidade)"
              color="#f59e0b"
              icon={Activity}
            />
            <GaugeChart
              value={volumePercentage}
              max={200}
              label="Volume vs Média"
              color="#3b82f6"
              icon={Volume2}
            />
          </div>
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Preço Atual</p>
                <p className="font-bold text-lg">${conditionsStatus.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">EMA50</p>
                <p className="font-bold text-lg">${conditionsStatus.ema50Value.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Resistência</p>
                <p className="font-bold text-lg">${conditionsStatus.referenceHigh.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Suporte</p>
                <p className="font-bold text-lg">${conditionsStatus.referenceLow.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TechnicalGauges;
