import React, { useMemo } from 'react';
import { useMarketSurveillance } from '@/contexts/MarketSurveillanceContext';
import { SUPPORTED_PAIRS } from '@/services/surveillance/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const MarketControlBar = React.memo(function MarketControlBar() {
  const { state, changePair, reconnect } = useMarketSurveillance();

  const connectionStatus = useMemo(() => {
    if (state.isConnected) {
      return {
        icon: <Wifi className="h-3 w-3" />,
        label: 'Conectado',
        variant: 'default' as const,
        className: 'bg-success/20 text-success border-success/30',
      };
    }
    return {
      icon: <WifiOff className="h-3 w-3" />,
      label: 'Desconectado',
      variant: 'destructive' as const,
      className: 'bg-danger/20 text-danger border-danger/30',
    };
  }, [state.isConnected]);

  return (
    <div className="surveillance-control-bar flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
      {/* Logo/Title */}
      <div className="flex items-center gap-2 flex-1">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="text-lg">🔍</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            Vigilância de Mercado
          </h1>
          <p className="text-xs text-muted-foreground">
            Detecção em tempo real
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Pair Selector */}
        <Select
          value={state.selectedPair}
          onValueChange={changePair}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Par" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_PAIRS.map((pair) => (
              <SelectItem key={pair} value={pair}>
                {pair.replace('USDT', '/USDT')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Connection Status */}
        <Badge
          variant="outline"
          className={`h-9 px-3 flex items-center gap-1.5 ${connectionStatus.className}`}
        >
          {connectionStatus.icon}
          <span className="hidden sm:inline">{connectionStatus.label}</span>
        </Badge>

        {/* Reconnect Button */}
        {!state.isConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={reconnect}
            className="h-9"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconectar
          </Button>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="w-full mt-2 sm:mt-0 sm:w-auto">
          <Badge variant="destructive" className="text-xs">
            {state.error}
          </Badge>
        </div>
      )}
    </div>
  );
});
