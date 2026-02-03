import React, { useMemo } from 'react';
import { useMarketSurveillance } from '@/contexts/MarketSurveillanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export const CorrelationSimpleCard = React.memo(function CorrelationSimpleCard() {
  const { state } = useMarketSurveillance();

  const correlationData = useMemo(() => {
    if (!state.metrics) return null;

    const correlation = state.metrics.correlationMetrics.correlation;
    const isNormal = state.metrics.correlationMetrics.isNormalCorrelation;

    const getInterpretation = () => {
      if (correlation > 0.7) {
        return {
          label: 'Forte Positiva',
          description: 'Volume e preço movem juntos - tendência saudável',
          icon: <TrendingUp className="h-4 w-4" />,
          status: correlation > 0.9 ? 'warning' : 'success',
        };
      }
      if (correlation > 0.3) {
        return {
          label: 'Moderada Positiva',
          description: 'Relação normal entre volume e preço',
          icon: <TrendingUp className="h-4 w-4" />,
          status: 'success',
        };
      }
      if (correlation > -0.3) {
        return {
          label: 'Neutra',
          description: 'Volume e preço sem correlação clara',
          icon: <Activity className="h-4 w-4" />,
          status: 'warning',
        };
      }
      return {
        label: 'Negativa',
        description: 'Volume aumenta quando preço cai - possível distribuição',
        icon: <TrendingDown className="h-4 w-4" />,
        status: 'danger',
      };
    };

    return {
      value: correlation,
      ...getInterpretation(),
      isNormal,
    };
  }, [state.metrics]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success/20 text-success border-success/30';
      case 'warning':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'danger':
        return 'bg-danger/20 text-danger border-danger/30';
      default:
        return '';
    }
  };

  if (!correlationData) {
    return (
      <Card className="surveillance-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Correlação Preço-Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <p className="text-sm">Calculando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surveillance-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Correlação
          </CardTitle>
          <Badge
            variant="outline"
            className={getStatusClass(correlationData.status)}
          >
            {correlationData.icon}
            <span className="ml-1">{correlationData.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Correlation Value */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-foreground">
            {correlationData.value >= 0 ? '+' : ''}
            {(correlationData.value * 100).toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Coeficiente de Pearson
          </p>
        </div>

        {/* Visual Bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 h-full bg-gradient-to-r from-danger via-warning to-success"
            style={{ width: '100%' }}
          />
          <div
            className="absolute top-0 h-full w-1 bg-foreground rounded"
            style={{
              left: `${((correlationData.value + 1) / 2) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          <span>-100%</span>
          <span>0%</span>
          <span>+100%</span>
        </div>

        {/* Interpretation */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground">
            {correlationData.description}
          </p>
          {!correlationData.isNormal && (
            <p className="text-xs text-warning mt-2 font-medium">
              ⚠️ Correlação fora do padrão normal
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
