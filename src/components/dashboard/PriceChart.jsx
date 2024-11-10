import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceChart = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gráfico de Preços (30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p>Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gráfico de Preços (30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-red-500">Erro ao carregar dados: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Gráfico de Preços (30 dias)</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ 
                value: 'Preço (USD)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="Bitcoin" stroke="#f7931a" strokeWidth={2} />
            <Line type="monotone" dataKey="Ethereum" stroke="#627eea" strokeWidth={2} />
            <Line type="monotone" dataKey="Dogecoin" stroke="#c2a633" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PriceChart;