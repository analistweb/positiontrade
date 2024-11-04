import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MarketStats = ({ marketData }) => {
  const calculateTotalVolumes = () => {
    if (!marketData?.total_volumes) return { buy: 0, sell: 0 };
    
    return marketData.prices.reduce((acc, price, index) => {
      const volume = marketData.total_volumes[index][1];
      if (index > 0 && price[1] > marketData.prices[index - 1][1]) {
        acc.buy += volume;
      } else {
        acc.sell += volume;
      }
      return acc;
    }, { buy: 0, sell: 0 });
  };

  const volumes = calculateTotalVolumes();

  return (
    <div className="grid grid-cols-1 gap-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Volume Total de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${volumes.buy.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Volume Total de Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${volumes.sell.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketStats;