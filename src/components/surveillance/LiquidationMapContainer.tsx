import React, { useEffect } from 'react';
import { useLiquidationMap } from '@/hooks/useLiquidationMap';
import { useMarketSurveillance } from '@/contexts/MarketSurveillanceContext';
import LiquidationHeatmap from './LiquidationHeatmap';
import LiquidationStats from './LiquidationStats';
import LiquidationAlerts from './LiquidationAlerts';
import LiquidationDisclaimer from './LiquidationDisclaimer';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LiquidationMapContainer: React.FC = () => {
  const { state: surveillanceState } = useMarketSurveillance();
  const { selectedPair, metrics } = surveillanceState;

  const {
    state,
    mapData,
    alerts,
    eventCount,
    reconnect,
    setCurrentPrice,
  } = useLiquidationMap({
    symbol: selectedPair,
    enabled: true,
  });

  // Sync current price from surveillance metrics
  useEffect(() => {
    if (metrics?.price) {
      setCurrentPrice(metrics.price);
    }
  }, [metrics?.price, setCurrentPrice]);

  return (
    <div className="space-y-4">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            💧 Mapa de Liquidações
          </h3>
          <Badge variant="outline" className="text-xs">
            {selectedPair}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${
              state.isConnected
                ? 'bg-green-500/10 text-green-500 border-green-500/30'
                : 'bg-destructive/10 text-destructive border-destructive/30'
            }`}
          >
            {state.isConnected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Futures
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            {eventCount} eventos
          </Badge>

          {!state.isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reconnect}
              className="h-7 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Main content */}
      {mapData ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Heatmap - full width on mobile, spans left column on desktop */}
          <div className="md:col-span-2 lg:col-span-1">
            <LiquidationHeatmap mapData={mapData} />
          </div>

          {/* Stats */}
          <div className="md:col-span-1">
            <LiquidationStats mapData={mapData} />
          </div>

          {/* Alerts - full width */}
          <div className="md:col-span-2">
            <LiquidationAlerts alerts={alerts} />
          </div>

          {/* Disclaimer - full width */}
          <div className="md:col-span-2">
            <LiquidationDisclaimer />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">
            Conectando ao stream de liquidações da Binance Futures...
          </p>
          {!state.isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconectar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LiquidationMapContainer;
