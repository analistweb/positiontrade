import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const popularPairs = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'binancecoin', label: 'BNB' },
  { value: 'ripple', label: 'XRP' },
  { value: 'cardano', label: 'Cardano (ADA)' },
  { value: 'solana', label: 'Solana (SOL)' },
];

const fetchMarketData = async (coinId) => {
  const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
    params: {
      vs_currency: 'usd',
      days: 30,
      interval: 'daily'
    }
  });
  return response.data;
};

const calculateVolatility = (prices) => {
  const returns = prices.slice(1).map((price, index) => 
    (price - prices[index]) / prices[index]
  );
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const squaredDiffs = returns.map(ret => Math.pow(ret - avgReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
};

const identifyTrend = (prices) => {
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const change = (lastPrice - firstPrice) / firstPrice * 100;
  
  // Análise mais detalhada da tendência
  const shortTermMA = calculateMA(prices.slice(-7)); // Média móvel de 7 dias
  const longTermMA = calculateMA(prices); // Média móvel de 30 dias
  
  let trend = '';
  if (change > 5 && shortTermMA > longTermMA) {
    trend = "Alta Forte";
  } else if (change > 2 && shortTermMA > longTermMA) {
    trend = "Alta Moderada";
  } else if (change < -5 && shortTermMA < longTermMA) {
    trend = "Baixa Forte";
  } else if (change < -2 && shortTermMA < longTermMA) {
    trend = "Baixa Moderada";
  } else {
    trend = "Lateral";
  }

  return {
    trend,
    change: change.toFixed(2),
    shortTermMA: shortTermMA.toFixed(2),
    longTermMA: longTermMA.toFixed(2)
  };
};

const calculateMA = (prices) => {
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
};

const RiscoOportunidade = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [alertPrice, setAlertPrice] = useState('');
  const [alerts, setAlerts] = useState([]);

  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['marketData', selectedCoin],
    queryFn: () => fetchMarketData(selectedCoin),
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  const handleCoinChange = (value) => {
    setSelectedCoin(value);
  };

  if (isLoading) return <div className="container mx-auto p-4">Carregando...</div>;
  if (error) return <div className="container mx-auto p-4">Erro ao carregar os dados: {error.message}</div>;

  const prices = marketData.prices.map(price => price[1]);
  const volatility = calculateVolatility(prices);
  const trendAnalysis = identifyTrend(prices);

  const chartData = marketData.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Risco & Oportunidade</h1>

      <div className="mb-6">
        <Label htmlFor="coin-select">Selecione a Criptomoeda</Label>
        <Select onValueChange={handleCoinChange} value={selectedCoin}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Selecione uma criptomoeda" />
          </SelectTrigger>
          <SelectContent>
            {popularPairs.map((pair) => (
              <SelectItem key={pair.value} value={pair.value}>
                {pair.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Preço ({popularPairs.find(p => p.value === selectedCoin)?.label})</CardTitle>
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
            <CardTitle>Volatilidade (Anualizada)</CardTitle>
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
            <p className="text-2xl font-bold">{trendAnalysis.trend}</p>
            <p className="text-sm text-gray-600">Variação: {trendAnalysis.change}%</p>
            <p className="text-sm text-gray-600">MA7: ${trendAnalysis.shortTermMA}</p>
            <p className="text-sm text-gray-600">MA30: ${trendAnalysis.longTermMA}</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertTitle>Análise de Risco e Oportunidade</AlertTitle>
        <AlertDescription>
          <p>Com base nos dados atuais:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>A volatilidade está {volatility > 50 ? 'alta' : 'moderada'}, indicando um {volatility > 50 ? 'alto' : 'médio'} nível de risco.</li>
            <li>A tendência {trendAnalysis.trend.toLowerCase()} sugere {
              trendAnalysis.trend.includes('Alta') ? 'possíveis oportunidades de compra' : 
              trendAnalysis.trend.includes('Baixa') ? 'cautela nas compras' : 
              'um mercado estável'
            }.</li>
            <li>Média Móvel de 7 dias {parseFloat(trendAnalysis.shortTermMA) > parseFloat(trendAnalysis.longTermMA) ? 'acima' : 'abaixo'} da Média Móvel de 30 dias, indicando tendência de {parseFloat(trendAnalysis.shortTermMA) > parseFloat(trendAnalysis.longTermMA) ? 'alta' : 'baixa'} no curto prazo.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RiscoOportunidade;