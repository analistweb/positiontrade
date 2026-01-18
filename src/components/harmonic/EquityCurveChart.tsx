import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EquityCurveChartProps {
  capitalCurve: number[];
  initialCapital: number;
}

export function EquityCurveChart({ capitalCurve, initialCapital }: EquityCurveChartProps) {
  if (!capitalCurve || capitalCurve.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Curva de Capital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            Execute o backtest para visualizar a curva de capital.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcula drawdown para cada ponto
  let maxCapital = initialCapital;
  const data = capitalCurve.map((capital, index) => {
    maxCapital = Math.max(maxCapital, capital);
    const drawdown = ((maxCapital - capital) / maxCapital) * 100;
    return {
      index,
      capital,
      drawdown,
      maxCapital
    };
  });

  // Amostragem para performance (máx 500 pontos)
  const step = Math.max(1, Math.floor(data.length / 500));
  const sampledData = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const finalCapital = capitalCurve[capitalCurve.length - 1];
  const profitPercent = ((finalCapital - initialCapital) / initialCapital) * 100;
  const isProfitable = finalCapital >= initialCapital;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Curva de Capital
          </span>
          <span className={`text-lg font-mono ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            ${finalCapital.toFixed(0)} ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sampledData}>
              <defs>
                <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isProfitable ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isProfitable ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="index" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${Math.floor(v / 1000)}k`}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'capital') return [`$${value.toFixed(0)}`, 'Capital'];
                  if (name === 'drawdown') return [`${value.toFixed(1)}%`, 'Drawdown'];
                  return [value, name];
                }}
              />
              <ReferenceLine 
                y={initialCapital} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ value: 'Inicial', position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="capital"
                stroke={isProfitable ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill="url(#capitalGradient)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
