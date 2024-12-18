import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BollingerBands = ({ data }) => {
  if (!data || !data.prices) return null;

  const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
    const priceValues = prices.map(price => price[1]);
    const sma = [];
    const upperBand = [];
    const lowerBand = [];

    for (let i = 0; i < priceValues.length; i++) {
      if (i < period - 1) {
        sma.push(null);
        upperBand.push(null);
        lowerBand.push(null);
        continue;
      }

      const slice = priceValues.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, price) => sum + price, 0) / period;
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      sma.push(avg);
      upperBand.push(avg + stdDev * standardDeviation);
      lowerBand.push(avg - stdDev * standardDeviation);
    }

    return prices.map((price, index) => ({
      date: new Date(price[0]).toLocaleDateString(),
      price: price[1],
      sma: sma[index],
      upper: upperBand[index],
      lower: lowerBand[index]
    }));
  };

  const bollingerData = calculateBollingerBands(data.prices);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Bollinger Bands
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Bollinger Bands (20, 2)</p>
                <p>Período: 20 dias</p>
                <p>Desvio Padrão: 2</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={bollingerData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="price" stroke="#2196F3" name="Preço" dot={false} />
            <Line type="monotone" dataKey="sma" stroke="#FF9800" name="SMA" dot={false} />
            <Line type="monotone" dataKey="upper" stroke="#4CAF50" name="Banda Superior" dot={false} />
            <Line type="monotone" dataKey="lower" stroke="#f44336" name="Banda Inferior" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BollingerBands;