import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const VolumeChart = ({ marketData, minVolume }) => {
  console.log("VolumeChart received marketData:", marketData); // Debug log

  const processData = (data) => {
    console.log("Processing data:", data); // Debug log
    
    if (!data || !data.prices || !data.total_volumes) {
      console.log("Invalid or missing data"); // Debug log
      return [];
    }
    
    const priceRanges = {};
    
    try {
      data.prices.forEach((price, index) => {
        if (!price || !Array.isArray(price) || price.length < 2) {
          console.log("Invalid price data at index:", index); // Debug log
          return;
        }

        const [timestamp, priceValue] = price;
        const volume = data.total_volumes[index]?.[1] || 0;
        
        if (volume < (minVolume || 0)) return;

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
    } catch (error) {
      console.error("Error processing data:", error); // Debug log
      return [];
    }

    return Object.entries(priceRanges).map(([range, volumes]) => ({
      preco: range,
      compra: volumes.buy,
      venda: volumes.sell
    }));
  };

  const chartData = processData(marketData);
  console.log("Processed chartData:", chartData); // Debug log

  if (!marketData) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Volume de Compra/Venda por Faixa de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Carregando dados do mercado...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Volume de Compra/Venda por Faixa de Preço</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Nenhum dado disponível para exibição
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VolumeChart;