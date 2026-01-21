import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CandlestickChart as ChartIcon } from 'lucide-react';
import type { Candle, SupportResistanceLevel, PositionEntry } from '@/services/positionAnalysis/types';

interface PositionChartProps {
  candles: Candle[];
  sma50: number[];
  sma200: number[];
  levels: SupportResistanceLevel[];
  entries: PositionEntry[];
  currency: string;
}

export function PositionChart({
  candles,
  sma50,
  sma200,
  levels,
  entries,
  currency,
}: PositionChartProps) {
  const chartData = useMemo(() => {
    // Pegar últimos 120 candles para visualização
    const recentCandles = candles.slice(-120);
    const offset = candles.length - 120;

    return recentCandles.map((candle, idx) => {
      const globalIdx = Math.max(0, offset + idx);
      return {
        date: candle.date,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        sma50: sma50[globalIdx],
        sma200: sma200[globalIdx],
        // Cor do candle
        color: candle.close >= candle.open ? '#22c55e' : '#ef4444',
      };
    });
  }, [candles, sma50, sma200]);

  const formatPrice = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Abertura:</span>
          <span className="font-medium">{formatPrice(data.open)}</span>
          <span className="text-muted-foreground">Máxima:</span>
          <span className="font-medium text-green-400">{formatPrice(data.high)}</span>
          <span className="text-muted-foreground">Mínima:</span>
          <span className="font-medium text-red-400">{formatPrice(data.low)}</span>
          <span className="text-muted-foreground">Fechamento:</span>
          <span className={`font-medium ${data.close >= data.open ? 'text-green-400' : 'text-red-400'}`}>
            {formatPrice(data.close)}
          </span>
          {data.sma50 && (
            <>
              <span className="text-muted-foreground">SMA50:</span>
              <span className="font-medium text-blue-400">{formatPrice(data.sma50)}</span>
            </>
          )}
          {data.sma200 && (
            <>
              <span className="text-muted-foreground">SMA200:</span>
              <span className="font-medium text-orange-400">{formatPrice(data.sma200)}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  // Calcular domínio do Y
  const yDomain = useMemo(() => {
    const allValues = chartData.flatMap(d => [d.high, d.low, d.sma50, d.sma200].filter(v => v && !isNaN(v)));
    const min = Math.min(...allValues) * 0.98;
    const max = Math.max(...allValues) * 1.02;
    return [min, max];
  }, [chartData]);

  // Filtrar níveis visíveis no range
  const visibleLevels = useMemo(() => {
    return levels.filter(l => l.price >= yDomain[0] && l.price <= yDomain[1]).slice(0, 6);
  }, [levels, yDomain]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <ChartIcon className="h-4 w-4" />
              Gráfico de Preços
            </span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                SMA50
              </Badge>
              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                SMA200
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  domain={yDomain}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={formatPrice}
                  width={70}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Suportes e Resistências */}
                {visibleLevels.map((level, idx) => (
                  <ReferenceLine
                    key={idx}
                    y={level.price}
                    stroke={level.type === 'suporte' ? '#22c55e' : '#ef4444'}
                    strokeDasharray="4 4"
                    strokeOpacity={level.strength === 'forte' ? 0.8 : level.strength === 'média' ? 0.5 : 0.3}
                  />
                ))}

                {/* Entradas sugeridas */}
                {entries.map((entry, idx) => (
                  <ReferenceLine
                    key={`entry-${idx}`}
                    y={entry.preco}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                  />
                ))}

                {/* Range de preços (high-low) como área */}
                <Area
                  dataKey="high"
                  stroke="none"
                  fill="transparent"
                  activeDot={false}
                />

                {/* Linha de fechamento */}
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />

                {/* SMA50 */}
                <Line
                  type="monotone"
                  dataKey="sma50"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />

                {/* SMA200 */}
                <Line
                  type="monotone"
                  dataKey="sma200"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda dos níveis */}
          {visibleLevels.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2">Níveis no gráfico:</p>
              <div className="flex flex-wrap gap-2">
                {visibleLevels.map((level, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={`text-xs ${
                      level.type === 'suporte'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {level.type === 'suporte' ? 'S' : 'R'}: {formatPrice(level.price)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
