import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MACDIndicator = ({ data }) => {
  if (!data || !data.prices) return null;

  const calculateMACD = (prices, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
    const shortEMA = calculateEMA(prices, shortPeriod);
    const longEMA = calculateEMA(prices, longPeriod);
    const macdLine = shortEMA.map((value, index) => value - longEMA[index]);
    const signalLine = calculateEMA(macdLine, signalPeriod);
    const histogram = macdLine.map((value, index) => value - signalLine[index]);

    return prices.map((price, index) => ({
      date: new Date(price[0]).toLocaleDateString(),
      macd: macdLine[index]?.toFixed(2) || 0,
      signal: signalLine[index]?.toFixed(2) || 0,
      histogram: histogram[index]?.toFixed(2) || 0
    }));
  };

  const calculateEMA = (prices, period) => {
    const priceValues = prices.map(price => price[1]);
    const multiplier = 2 / (period + 1);
    const ema = [priceValues[0]];

    for (let i = 1; i < priceValues.length; i++) {
      ema.push((priceValues[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }

    return ema;
  };

  const macdData = calculateMACD(data.prices);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          MACD
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Moving Average Convergence Divergence (MACD)</p>
                <p>Períodos: 12/26/9</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={macdData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="macd" stroke="#2196F3" name="MACD" />
            <Line type="monotone" dataKey="signal" stroke="#FF9800" name="Signal" />
            <Line type="monotone" dataKey="histogram" stroke="#4CAF50" name="Histogram" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MACDIndicator;