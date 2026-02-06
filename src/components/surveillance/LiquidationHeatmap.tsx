import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import {
  LiquidationMapData,
  LiquidationZone,
  ProjectedLiquidationZone,
} from '@/services/liquidation/types';

interface LiquidationHeatmapProps {
  mapData: LiquidationMapData;
}

const LiquidationHeatmap: React.FC<LiquidationHeatmapProps> = React.memo(
  ({ mapData }) => {
    const {
      currentPrice,
      historicalZones,
      projectedZones,
      dataState,
      projectionState,
    } = mapData;

    // Combine and sort all zones by price
    const allZones = useMemo(() => {
      const historical = historicalZones.map(z => ({
        ...z,
        isProjected: false as const,
      }));
      const projected = projectedZones.map(z => ({
        ...z,
        isProjected: true as const,
      }));
      
      return [...historical, ...projected].sort(
        (a, b) => b.priceMid - a.priceMid
      );
    }, [historicalZones, projectedZones]);

    // Find price range for visualization
    const { minPrice, maxPrice } = useMemo(() => {
      if (allZones.length === 0) {
        return {
          minPrice: currentPrice * 0.95,
          maxPrice: currentPrice * 1.05,
        };
      }
      
      const prices = allZones.flatMap(z => [z.priceMin, z.priceMax]);
      prices.push(currentPrice);
      
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const padding = (max - min) * 0.1;
      
      return {
        minPrice: min - padding,
        maxPrice: max + padding,
      };
    }, [allZones, currentPrice]);

    // Calculate position for a price
    const getPricePosition = (price: number): number => {
      return ((maxPrice - price) / (maxPrice - minPrice)) * 100;
    };

    const currentPricePosition = getPricePosition(currentPrice);

    if (dataState === 'INSUFFICIENT') {
      return (
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              Dados insuficientes para visualização.
              <br />
              Aguardando eventos de liquidação...
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <TooltipProvider>
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Mapa de Liquidações
              </CardTitle>
              <div className="flex items-center gap-2">
                {dataState === 'DEGRADED' && (
                  <Badge variant="outline\" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                    Dados Limitados
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    projectionState === 'HISTORICAL_PLUS_PROJECTION'
                      ? 'text-xs bg-blue-500/10 text-blue-500 border-blue-500/30'
                      : 'text-xs bg-muted text-muted-foreground'
                  }
                >
                  {projectionState === 'HISTORICAL_PLUS_PROJECTION'
                    ? 'Com Projeção'
                    : projectionState === 'PROJECTION_BLOCKED_REGIME_CHANGE'
                    ? 'Regime Instável'
                    : 'Histórico'}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Heatmap Container */}
            <div className="relative h-64 bg-muted/20 rounded-lg overflow-hidden border border-border/30">
              {/* Price scale on left */}
              <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between py-2 px-1 text-xs text-muted-foreground border-r border-border/30 bg-background/50">
                <span>${maxPrice.toFixed(0)}</span>
                <span>${currentPrice.toFixed(0)}</span>
                <span>${minPrice.toFixed(0)}</span>
              </div>

              {/* Zones area */}
              <div className="absolute left-16 right-0 top-0 bottom-0">
                {/* Historical zones */}
                {historicalZones.map((zone, idx) => (
                  <ZoneBar
                    key={`hist-${idx}`}
                    zone={zone}
                    topPosition={getPricePosition(zone.priceMax)}
                    height={
                      getPricePosition(zone.priceMin) -
                      getPricePosition(zone.priceMax)
                    }
                    isProjected={false}
                  />
                ))}

                {/* Projected zones */}
                {projectedZones.map((zone, idx) => (
                  <ProjectedZoneBar
                    key={`proj-${idx}`}
                    zone={zone}
                    topPosition={getPricePosition(zone.priceMax)}
                    height={
                      getPricePosition(zone.priceMin) -
                      getPricePosition(zone.priceMax)
                    }
                  />
                ))}

                {/* Current price line */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-foreground/80 z-10"
                  style={{ top: `${currentPricePosition}%` }}
                >
                  <div className="absolute right-2 -top-3 text-xs font-medium bg-background px-1 rounded">
                    ${currentPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/60" />
                <span className="text-muted-foreground">SHORT liquidado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500/60" />
                <span className="text-muted-foreground">LONG liquidado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-dashed border-muted-foreground/50 bg-muted/30" />
                <span className="text-muted-foreground">Zona projetada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }
);

LiquidationHeatmap.displayName = 'LiquidationHeatmap';

// ========================================
// ZONE BAR COMPONENT (Historical)
// ========================================

interface ZoneBarProps {
  zone: LiquidationZone;
  topPosition: number;
  height: number;
  isProjected: boolean;
}

const ZoneBar: React.FC<ZoneBarProps> = React.memo(
  ({ zone, topPosition, height }) => {
    const bgColor = zone.dominantSide === 'SHORT'
      ? 'bg-red-500'
      : zone.dominantSide === 'LONG'
      ? 'bg-green-500'
      : 'bg-muted-foreground';

    const opacity = 0.3 + zone.relativeIntensity * 0.5;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`absolute left-0 right-0 ${bgColor} cursor-pointer transition-opacity hover:opacity-100`}
            style={{
              top: `${Math.max(0, topPosition)}%`,
              height: `${Math.max(2, height)}%`,
              opacity,
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-medium flex items-center gap-1">
              {zone.dominantSide === 'LONG' ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500" />
              )}
              Zona Histórica ({zone.dominantSide})
            </div>
            <div>Faixa: ${zone.priceMin.toFixed(2)} - ${zone.priceMax.toFixed(2)}</div>
            <div>Volume: ${(zone.totalVolume / 1000).toFixed(1)}K</div>
            <div>Eventos: {zone.eventCount}</div>
            <div>Distância: {zone.distancePercent.toFixed(2)}%</div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
);

ZoneBar.displayName = 'ZoneBar';

// ========================================
// PROJECTED ZONE BAR COMPONENT
// ========================================

interface ProjectedZoneBarProps {
  zone: ProjectedLiquidationZone;
  topPosition: number;
  height: number;
}

const ProjectedZoneBar: React.FC<ProjectedZoneBarProps> = React.memo(
  ({ zone, topPosition, height }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute left-0 right-0 border-2 border-dashed border-muted-foreground/50 bg-muted/20 cursor-pointer transition-opacity hover:bg-muted/40"
            style={{
              top: `${Math.max(0, topPosition)}%`,
              height: `${Math.max(4, height)}%`,
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              Zona Projetada ({zone.projectedSide})
            </div>
            <div>Faixa: ${zone.priceMin.toFixed(2)} - ${zone.priceMax.toFixed(2)}</div>
            <div>Intensidade: {zone.projectedIntensity}</div>
            <div>Confiança: {zone.confidence}</div>
            <div>Distância: {zone.distancePercent.toFixed(2)}%</div>
            <div className="pt-1 text-muted-foreground italic">
              Baseado em janela de {zone.basedOnWindowMinutes} min
            </div>
            <div className="pt-1 p-1 bg-yellow-500/10 rounded text-yellow-600 dark:text-yellow-400">
              Zona projetada por extrapolação estatística.
              Válida apenas se o regime atual persistir.
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
);

ProjectedZoneBar.displayName = 'ProjectedZoneBar';

export default LiquidationHeatmap;
