import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fetchMarketData = async () => {
  const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
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
  return Math.sqrt(variance) * Math.sqrt(365) * 100; // Anualizada e em porcentagem
};

const identifyTrend = (prices) => {
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const change = (lastPrice - firstPrice) / firstPrice * 100;
  if (change > 5) return "Alta";
  if (change < -5) return "Baixa";
  return "Lateral";
};

const RiscoOportunidade = () => {
  const [alertPrice, setAlertPrice] = useState('');
  const [alerts, setAlerts] = useState([]);

  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['bitcoinMarketData'],
    queryFn: fetchMarketData,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  useEffect(() => {
    if (marketData && alerts.length > 0) {
      const currentPrice = marketData.prices[marketData.prices.length - 1][1];
      alerts.forEach(alert => {
        if ((alert.type === 'above' && currentPrice > alert.price) ||
            (alert.type === 'below' && currentPrice < alert.price)) {
          // Aqui você pode implementar uma notificação real (e.g., push notification, e-mail)
          console.log(`Alerta: O preço do Bitcoin está ${alert.type === 'above' ? 'acima' : 'abaixo'} de $${alert.price}`);
        }
      });
    }
  }, [marketData, alerts]);

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar os dados: {error.message}</div>;

  const prices = marketData.prices.map(price => price[1]);
  const volatility = calculateVolatility(prices);
  const trend = identifyTrend(prices);

  const chartData = marketData.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));

  const addAlert = (type) => {
    if (alertPrice) {
      setAlerts([...alerts, { type, price: parseFloat(alertPrice) }]);
      setAlertPrice('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Risco & Oportunidade</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Preço do Bitcoin (30 dias)</CardTitle>
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
            <p className="text-2xl font-bold">{trend}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configurar Alertas de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Label htmlFor="price-alert">Preço Alvo ($)</Label>
            <Input
              id="price-alert"
              type="number"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              placeholder="Digite o preço alvo"
            />
            <Button onClick={() => addAlert('above')}>Alerta Acima</Button>
            <Button onClick={() => addAlert('below')}>Alerta Abaixo</Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Análise de Risco e Oportunidade</AlertTitle>
        <AlertDescription>
          <p>Com base nos dados atuais:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>A volatilidade está {volatility > 50 ? 'alta' : 'moderada'}, indicando um {volatility > 50 ? 'alto' : 'médio'} nível de risco.</li>
            <li>A tendência de {trend.toLowerCase()} sugere {trend === 'Alta' ? 'possíveis oportunidades de compra' : trend === 'Baixa' ? 'cautela nas compras' : 'um mercado estável'}.</li>
            <li>Considere configurar alertas para ser notificado sobre movimentos significativos de preço.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RiscoOportunidade;