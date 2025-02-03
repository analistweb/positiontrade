import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";

const PriceChart = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
        <CardHeader>
          <CardTitle className="text-gray-200">Gráfico de Preços (30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-red-900/50 to-red-800/50 border-none">
        <CardHeader>
          <CardTitle className="text-gray-200">Gráfico de Preços (30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-red-400">Erro ao carregar dados: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-morphism p-4 rounded-lg bg-gray-900/90 border border-gray-700">
          <p className="text-gray-200 font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>
              <span className="font-mono">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
      <CardHeader>
        <CardTitle className="text-gray-200">Gráfico de Preços (30 dias)</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis 
              label={{ 
                value: 'Preço (USD)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#9ca3af', textAnchor: 'middle' }
              }}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              stroke="rgba(255,255,255,0.1)"
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '20px' }}
            />
            <Line 
              type="monotone" 
              dataKey="Bitcoin" 
              stroke="#f7931a" 
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="Ethereum" 
              stroke="#627eea" 
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="Dogecoin" 
              stroke="#c2a633" 
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PriceChart;