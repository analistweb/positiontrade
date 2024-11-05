import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTopFormationData } from '../services/cryptoService';
import { toast } from "sonner";

const FormacaoTopo = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topFormation'],
    queryFn: () => fetchTopFormationData(),
    refetchInterval: 60000, // Atualiza a cada minuto
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  });

  if (isLoading) return <div className="p-4">Carregando dados...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error.message}</div>;

  const chartData = data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Formação de Topo</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Análise de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Indicadores Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Preço Atual: ${data.prices[data.prices.length - 1][1].toFixed(2)}</p>
              <p>Variação 24h: {((data.prices[data.prices.length - 1][1] - data.prices[data.prices.length - 24][1]) / data.prices[data.prices.length - 24][1] * 100).toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormacaoTopo;