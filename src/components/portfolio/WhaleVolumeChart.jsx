import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Waves } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const WhaleVolumeChart = ({ transactions, isLoading }) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Agrupar transações por hora
    const hourlyData = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
      
      if (!hourlyData.has(hourKey)) {
        hourlyData.set(hourKey, {
          timestamp: hourKey,
          buyVolume: 0,
          sellVolume: 0,
          totalVolume: 0,
          transactions: 0
        });
      }
      
      const data = hourlyData.get(hourKey);
      data.transactions += 1;
      data.totalVolume += transaction.volume || 0;
      
      if (transaction.type === 'Compra') {
        data.buyVolume += transaction.volume || 0;
      } else {
        data.sellVolume += transaction.volume || 0;
      }
    });

    // Converter para array e ordenar por timestamp
    return Array.from(hourlyData.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-24) // Últimas 24 horas
      .map(item => ({
        ...item,
        time: new Date(item.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
  }, [transactions]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{data.time}</p>
          <div className="space-y-1 text-xs">
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Compras: ${(data.buyVolume / 1e6).toFixed(2)}M
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Vendas: ${(data.sellVolume / 1e6).toFixed(2)}M
            </p>
            <p className="font-medium mt-1">
              Total: ${(data.totalVolume / 1e6).toFixed(2)}M
            </p>
            <p className="text-muted-foreground">
              {data.transactions} transações
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Volume ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Volume ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>Sem dados disponíveis para o período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Volume ao Longo do Tempo
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Últimas 24 horas de atividade
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="sellGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1e6).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="buyVolume" 
              name="Compras"
              stroke="#10b981" 
              strokeWidth={2}
              fill="url(#buyGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="sellVolume" 
              name="Vendas"
              stroke="#ef4444" 
              strokeWidth={2}
              fill="url(#sellGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WhaleVolumeChart;
