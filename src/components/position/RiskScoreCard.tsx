import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, ShieldAlert, ShieldX, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { RiskAnalysis } from '@/services/positionAnalysis/types';

interface RiskScoreCardProps {
  risk: RiskAnalysis;
}

export function RiskScoreCard({ risk }: RiskScoreCardProps) {
  const getRiskIcon = () => {
    switch (risk.nivel) {
      case 'crítico':
        return <ShieldX className="h-8 w-8" />;
      case 'alto':
        return <ShieldAlert className="h-8 w-8" />;
      case 'médio':
        return <AlertTriangle className="h-8 w-8" />;
      default:
        return <Shield className="h-8 w-8" />;
    }
  };

  const getRiskColor = () => {
    switch (risk.nivel) {
      case 'crítico':
        return 'text-red-500';
      case 'alto':
        return 'text-orange-500';
      case 'médio':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getRiskBg = () => {
    switch (risk.nivel) {
      case 'crítico':
        return 'from-red-500/20 to-red-500/5';
      case 'alto':
        return 'from-orange-500/20 to-orange-500/5';
      case 'médio':
        return 'from-yellow-500/20 to-yellow-500/5';
      default:
        return 'from-green-500/20 to-green-500/5';
    }
  };

  const getProgressColor = () => {
    if (risk.score >= 60) return 'bg-red-500';
    if (risk.score >= 40) return 'bg-orange-500';
    if (risk.score >= 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className={`relative overflow-hidden bg-gradient-to-br ${getRiskBg()} border-border/50`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Risco de Queda
            </span>
            <Badge 
              variant="outline" 
              className={`text-xs ${getRiskColor()} border-current`}
            >
              {risk.nivel.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={getRiskColor()}>
              {getRiskIcon()}
            </div>
            <div className="flex-1">
              <p className={`text-4xl font-bold ${getRiskColor()}`}>
                {risk.score}
                <span className="text-lg text-muted-foreground">/100</span>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${risk.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${getProgressColor()} rounded-full`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Baixo</span>
              <span>Médio</span>
              <span>Alto</span>
              <span>Crítico</span>
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="space-y-2 pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Indicadores de Risco</p>
            
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 text-xs ${risk.deathCross ? 'text-red-400' : 'text-green-400'}`}>
                {risk.deathCross ? <ShieldX className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                Death Cross
              </div>
              <div className={`flex items-center gap-2 text-xs ${risk.rsiBearishDivergence ? 'text-red-400' : 'text-green-400'}`}>
                {risk.rsiBearishDivergence ? <ShieldX className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                Div. Baixa RSI
              </div>
              <div className={`flex items-center gap-2 text-xs ${risk.atrIncreasing ? 'text-yellow-400' : 'text-green-400'}`}>
                {risk.atrIncreasing ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                ATR Crescente
              </div>
              <div className={`flex items-center gap-2 text-xs ${risk.supportBreak ? 'text-red-400' : 'text-green-400'}`}>
                {risk.supportBreak ? <ShieldX className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                Romp. Suporte
              </div>
            </div>
          </div>

          {/* Signals List */}
          {risk.sinais.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Alertas</p>
              <ul className="space-y-1">
                {risk.sinais.map((sinal, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className={getRiskColor()}>•</span>
                    {sinal}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
