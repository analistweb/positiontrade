import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
        <p className="font-semibold text-sm mb-2">{label}</p>
        <div className="space-y-1 text-xs">
          <p className="text-green-500">Máxima: ${data.high?.toFixed(2)}</p>
          <p className="text-blue-500">Abertura: ${data.open?.toFixed(2)}</p>
          <p className="text-purple-500">Fechamento: ${data.close?.toFixed(2)}</p>
          <p className="text-red-500">Mínima: ${data.low?.toFixed(2)}</p>
          <p className="text-muted-foreground">Volume: {(data.volume / 1000).toFixed(1)}K</p>
        </div>
      </div>
    );
  }
  return null;
};

const CandlestickChart = ({ marketData, lastSignal }) => {
  if (!marketData || marketData.length === 0) return null;

  // Pega os últimos 30 candles para melhor visualização
  const chartData = marketData.slice(-30).map((candle, index) => {
    const isGreen = candle.close >= candle.open;
    return {
      time: new Date(candle.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      bodyBottom: Math.min(candle.open, candle.close),
      bodyTop: Math.max(candle.open, candle.close),
      wickBottom: candle.low,
      wickTop: candle.high,
      isGreen
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            ETHUSDT - 15 Minutos (Últimos 30 Candles)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Linha de sinal se existir */}
              {lastSignal && (
                <ReferenceLine
                  y={lastSignal.entryPrice}
                  stroke={lastSignal.type === 'COMPRA' ? '#10b981' : '#ef4444'}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `${lastSignal.type} $${lastSignal.entryPrice.toFixed(2)}`,
                    position: 'right',
                    fill: lastSignal.type === 'COMPRA' ? '#10b981' : '#ef4444',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              )}
              
              {/* Volume como barra de fundo */}
              <Bar 
                dataKey="volume" 
                fill="hsl(var(--primary))" 
                opacity={0.1}
                yAxisId="volume"
              />
              
              {/* Preço de fechamento como linha */}
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CandlestickChart;
