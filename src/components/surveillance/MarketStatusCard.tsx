import React, { useMemo } from 'react';
import { useMarketSurveillance } from '@/contexts/MarketSurveillanceContext';
import { getStatusInfo } from '@/services/surveillance/marketStatusEngine';
import { Card, CardContent } from '@/components/ui/card';

export const MarketStatusCard = React.memo(function MarketStatusCard() {
  const { state } = useMarketSurveillance();

  const statusInfo = useMemo(() => {
    return getStatusInfo(state.status);
  }, [state.status]);

  const gradientClass = useMemo(() => {
    switch (state.status) {
      case 'HEALTHY':
        return 'surveillance-gradient-healthy';
      case 'ARTIFICIAL':
        return 'surveillance-gradient-artificial';
      case 'MANIPULATED':
        return 'surveillance-gradient-manipulated';
      default:
        return '';
    }
  }, [state.status]);

  return (
    <Card className={`surveillance-card overflow-hidden ${gradientClass}`}>
      <CardContent className="pt-8 pb-8 text-center">
        {/* Status Icon */}
        <div className="surveillance-status-icon mb-4">
          {statusInfo.icon}
        </div>

        {/* Status Label */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {statusInfo.label}
        </h2>

        {/* Status Description */}
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {statusInfo.description}
        </p>

        {/* Price Info */}
        {state.metrics && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Preço</p>
              <p className="text-lg font-semibold text-foreground">
                ${state.metrics.price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">24h</p>
              <p
                className={`text-lg font-semibold ${
                  state.metrics.priceChange24h >= 0
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                {state.metrics.priceChange24h >= 0 ? '+' : ''}
                {state.metrics.priceChange24h.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {/* Last Update */}
        {state.lastUpdate && (
          <p className="mt-4 text-xs text-muted-foreground/60">
            Atualizado {state.lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
});
