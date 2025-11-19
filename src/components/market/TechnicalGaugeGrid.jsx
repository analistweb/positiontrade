import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

const CircularGauge = ({ value, max, label, icon: Icon, color }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 mb-1" style={{ color }} />
          <span className="text-xl sm:text-2xl font-bold">{value.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">{label}</p>
    </div>
  );
};

const TechnicalGaugeGrid = ({ rsi, mma200Ratio, volumeChange }) => {
  const gauges = [
    {
      value: rsi || 50,
      max: 100,
      label: "RSI (14)",
      icon: Activity,
      color: rsi > 70 ? '#ef4444' : rsi < 30 ? '#22c55e' : '#3b82f6'
    },
    {
      value: Math.abs(mma200Ratio || 1) * 100,
      max: 200,
      label: "200 MMA",
      icon: TrendingUp,
      color: mma200Ratio > 1.2 ? '#ef4444' : mma200Ratio < 0.8 ? '#22c55e' : '#f59e0b'
    },
    {
      value: Math.min(Math.abs(volumeChange || 0), 100),
      max: 100,
      label: "Volume 24h",
      icon: BarChart3,
      color: volumeChange > 0 ? '#22c55e' : '#ef4444'
    }
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Indicadores Técnicos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {gauges.map((gauge, index) => (
            <motion.div
              key={gauge.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CircularGauge {...gauge} />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicalGaugeGrid;
