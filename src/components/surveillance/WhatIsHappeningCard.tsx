import React, { useMemo } from 'react';
import { useMarketSurveillance } from '@/contexts/MarketSurveillanceContext';
import { calculateDetailedStatus } from '@/services/surveillance/marketStatusEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const WhatIsHappeningCard = React.memo(function WhatIsHappeningCard() {
  const { state } = useMarketSurveillance();

  const detailedStatus = useMemo(() => {
    if (!state.metrics) return null;
    return calculateDetailedStatus(state.metrics);
  }, [state.metrics]);

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-danger" />;
      case 'medium':
        return <Info className="h-4 w-4 text-warning" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const styles = {
      high: 'bg-danger/20 text-danger border-danger/30',
      medium: 'bg-warning/20 text-warning border-warning/30',
      low: 'bg-success/20 text-success border-success/30',
    };
    return styles[severity];
  };

  if (!state.metrics || !detailedStatus) {
    return (
      <Card className="surveillance-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <span>📊</span>
            O Que Está Acontecendo?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-2">📡</div>
              <p className="text-sm">Aguardando dados...</p>
            </div>
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
            <span>📊</span>
            O Que Está Acontecendo?
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Score: {detailedStatus.score}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {detailedStatus.factors.length === 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Mercado Operando Normalmente
              </p>
              <p className="text-xs text-muted-foreground">
                Nenhum padrão suspeito detectado no momento
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {detailedStatus.factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                {getSeverityIcon(factor.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">
                      {factor.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getSeverityBadge(factor.severity)}`}
                    >
                      +{factor.contribution} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {factor.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
