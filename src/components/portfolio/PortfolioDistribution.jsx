import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { PieChartIcon } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-primary font-medium">
          {payload[0].payload.percentage}% da carteira
        </p>
      </div>
    );
  }
  return null;
};

const PortfolioDistribution = ({ portfolioData }) => {
  const totalValue = portfolioData?.reduce((acc, coin) => 
    acc + (coin.quantity * coin.current_price), 0) || 0;

  const distributionData = portfolioData?.map(coin => ({
    name: coin.symbol.toUpperCase(),
    value: coin.quantity * coin.current_price,
    percentage: ((coin.quantity * coin.current_price / totalValue) * 100).toFixed(1)
  })).sort((a, b) => b.value - a.value) || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Distribuição da Carteira
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage, name }) => `${name} ${percentage}%`}
                outerRadius={window.innerWidth < 640 ? 70 : 90}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Resumo da Diversificação:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Ativos:</span>
                <span className="ml-2 font-semibold">{distributionData.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Maior Posição:</span>
                <span className="ml-2 font-semibold">
                  {distributionData[0]?.name} ({distributionData[0]?.percentage}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PortfolioDistribution;
