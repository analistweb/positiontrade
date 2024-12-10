import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const VolumeChart = ({ marketData, minVolume }) => {
  const processData = (data) => {
    if (!data) return [];
    const priceRanges = {};
    
    data.prices.forEach((price, index) => {
      const [timestamp, priceValue] = price;
      const volume = data.total_volumes[index][1];
      if (volume < minVolume) return;

      const priceRange = Math.floor(priceValue / 1000) * 1000;
      const rangeKey = `${priceRange}-${priceRange + 999}`;
      
      if (!priceRanges[rangeKey]) {
        priceRanges[rangeKey] = { buy: 0, sell: 0 };
      }
      
      if (index > 0 && priceValue > data.prices[index - 1][1]) {
        priceRanges[rangeKey].buy += volume;
      } else {
        priceRanges[rangeKey].sell += volume;
      }
    });

    return Object.entries(priceRanges).map(([range, volumes]) => ({
      preco: range,
      compra: volumes.buy,
      venda: volumes.sell
    }));
  };

  const chartData = processData(marketData);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Volume de Compra/Venda por Faixa de Preço</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="preco" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="compra" name="Compra" fill="#82ca9d" />
            <Bar dataKey="venda" name="Venda" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VolumeChart;