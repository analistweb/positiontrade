import React, { useMemo } from 'react';
import { useMarketSurveillance } from '@/contexts/MarketSurveillanceContext';
import { getRiskLevel } from '@/services/surveillance/marketStatusEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

export const ImmediateRiskCard = React.memo(function ImmediateRiskCard() {
  const { state } = useMarketSurveillance();

  const riskData = useMemo(() => {
    const riskLevel = getRiskLevel(state.status);
    
    const getRecommendation = () => {
      if (riskLevel < 30) {
        return {
          icon: <ShieldCheck className="h-5 w-5 text-success" />,
          title: 'Seguro para Operar',
          description: 'Condições de mercado favoráveis. Prossiga com sua estratégia normal.',
          actions: ['Executar ordens normalmente', 'Monitorar mudanças'],
        };
      }
      if (riskLevel < 60) {
        return {
          icon: <Shield className="h-5 w-5 text-warning" />,
          title: 'Cautela Recomendada',
          description: 'Padrões incomuns detectados. Considere reduzir exposição.',
          actions: ['Reduzir tamanho das posições', 'Aumentar stops', 'Evitar alavancagem'],
        };
      }
      return {
        icon: <ShieldAlert className="h-5 w-5 text-danger" />,
        title: 'Risco Elevado',
        description: 'Manipulação ativa detectada. Operações podem ter resultados imprevisíveis.',
        actions: ['Evitar novas posições', 'Considerar saída', 'Aguardar estabilização'],
      };
    };

    const getRiskColor = () => {
      if (riskLevel < 30) return 'text-success';
      if (riskLevel < 60) return 'text-warning';
      return 'text-danger';
    };

    const getProgressColor = () => {
      if (riskLevel < 30) return '[&>div]:bg-success';
      if (riskLevel < 60) return '[&>div]:bg-warning';
      return '[&>div]:bg-danger';
    };

    return {
      level: riskLevel,
      recommendation: getRecommendation(),
      colorClass: getRiskColor(),
      progressClass: getProgressColor(),
    };
  }, [state.status]);

  return (
    <Card className="surveillance-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Risco Imediato
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Risk Meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Nível de Risco</span>
            <span className={`text-xl font-bold ${riskData.colorClass}`}>
              {riskData.level}%
            </span>
          </div>
          <Progress 
            value={riskData.level} 
            className={`h-2 ${riskData.progressClass}`}
          />
        </div>

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            {riskData.recommendation.icon}
            <span className="font-medium text-sm text-foreground">
              {riskData.recommendation.title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {riskData.recommendation.description}
          </p>
          
          {/* Action Items */}
          <div className="space-y-1">
            {riskData.recommendation.actions.map((action, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
