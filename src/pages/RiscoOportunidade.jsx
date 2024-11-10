import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchRiskOpportunityData, getTopCoins } from '../services/cryptoService';
import { toast } from "sonner";

const RiscoOportunidade = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const topCoins = getTopCoins();

  const { data, isLoading, error } = useQuery({
    queryKey: ['riskOpportunity', selectedCoin],
    queryFn: () => fetchRiskOpportunityData(selectedCoin),
    refetchInterval: 60000,
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  });

  if (isLoading) return <div className="p-4">Carregando dados...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error.message}</div>;
  if (!data || !data.marketData || !data.currentPrice) {
    return <div className="p-4">Nenhum dado disponível</div>;
  }

  const chartData = data.marketData.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));

  const volatility = calculateVolatility(data.marketData.prices);
  const trend = identifyTrend(data.marketData.prices);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Risco & Oportunidade</h1>
        <Select value={selectedCoin} onValueChange={setSelectedCoin}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione uma moeda" />
          </SelectTrigger>
          <SelectContent>
            {topCoins.map(coin => (
              <SelectItem key={coin} value={coin}>
                {coin.charAt(0).toUpperCase() + coin.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Preço {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)} (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Volatilidade (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{volatility.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tendência Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trend}</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertTitle>Análise de Risco</AlertTitle>
        <AlertDescription>
          <p>Baseado nos dados atuais:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Preço atual: ${data.currentPrice.usd.toFixed(2)}</li>
            <li>Volume 24h: ${(data.currentPrice.usd_24h_vol / 1000000).toFixed(2)}M</li>
            <li>Variação 24h: {data.currentPrice.usd_24h_change.toFixed(2)}%</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

const calculateVolatility = (prices) => {
  const returns = prices.slice(1).map((price, index) => 
    (price[1] - prices[index][1]) / prices[index][1]
  );
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const squaredDiffs = returns.map(ret => Math.pow(ret - avgReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
};

const identifyTrend = (prices) => {
  const lastPrice = prices[prices.length - 1][1];
  const firstPrice = prices[0][1];
  const change = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  if (change > 5) return "Alta";
  if (change < -5) return "Baixa";
  return "Lateral";
};

export default RiscoOportunidade;