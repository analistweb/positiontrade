import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, AlertCircle, Droplets } from 'lucide-react';
import { LiquidationMapData } from '@/services/liquidation/types';

interface LiquidationStatsProps {
  mapData: LiquidationMapData;
}

const LiquidationStats: React.FC<LiquidationStatsProps> = React.memo(
  ({ mapData }) => {
    const {
      totalLongVolume,
      totalShortVolume,
      eventCount,
      windowMinutes,
      dataState,
      historicalZones,
    } = mapData;

    const totalVolume = totalLongVolume + totalShortVolume;
    const longPercent = totalVolume > 0 ? (totalLongVolume / totalVolume) * 100 : 50;
    const shortPercent = 100 - longPercent;

    const formatVolume = (vol: number): string => {
      if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(2)}M`;
      if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
      return `$${vol.toFixed(0)}`;
    };

    // Determine dominant side
    const dominantSide = longPercent > 55 ? 'LONG' : shortPercent > 55 ? 'SHORT' : 'NEUTRAL';

    if (dataState === 'INSUFFICIENT') {
      return (
        <Card className="bg-card border-border/50">
          <CardContent className="py-6 text-center">
            <Droplets className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Aguardando dados de liquidação...
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Estatísticas de Liquidação
            <Badge variant="outline" className="text-xs ml-auto">
              {windowMinutes} min
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Volume Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-green-500">
                <TrendingDown className="h-3 w-3" />
                LONG {longPercent.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1 text-red-500">
                SHORT {shortPercent.toFixed(1)}%
                <TrendingUp className="h-3 w-3" />
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex bg-muted">
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${longPercent}%` }}
              />
              <div
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${shortPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground">Volume LONG</div>
              <div className="text-sm font-medium text-green-500">
                {formatVolume(totalLongVolume)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground">Volume SHORT</div>
              <div className="text-sm font-medium text-red-500">
                {formatVolume(totalShortVolume)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground">Total Eventos</div>
              <div className="text-sm font-medium">{eventCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground">Zonas Ativas</div>
              <div className="text-sm font-medium">{historicalZones.length}</div>
            </div>
          </div>

          {/* Dominant Side Indicator */}
          {dominantSide !== 'NEUTRAL' && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Maior pressão de liquidação em posições{' '}
                <span
                  className={
                    dominantSide === 'LONG' ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {dominantSide}
                </span>{' '}
                na janela atual
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

LiquidationStats.displayName = 'LiquidationStats';

export default LiquidationStats;
