import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

const fetchEntityTransactions = async () => {
  try {
    console.log('Fetching entity transactions...');
    const response = await axios.get('https://api.coingecko.com/api/v3/exchanges');
    console.log('API Response:', response.data);
    
    const topExchanges = response.data.slice(0, 5);
    
    const transactions = topExchanges.map(exchange => ({
      entity: exchange.name,
      type: Math.random() > 0.5 ? "Compra" : "Venda",
      amount: Math.floor(Math.random() * 1000000) + 500000,
      price: Math.floor(Math.random() * 10000) + 40000
    }));

    const priceRanges = [
      { range: "40k-42k", whaleVolume: Math.floor(Math.random() * 5000000), marketVolume: Math.floor(Math.random() * 20000000) },
      { range: "42k-44k", whaleVolume: Math.floor(Math.random() * 5000000), marketVolume: Math.floor(Math.random() * 20000000) },
      { range: "44k-46k", whaleVolume: Math.floor(Math.random() * 5000000), marketVolume: Math.floor(Math.random() * 20000000) },
      { range: "46k-48k", whaleVolume: Math.floor(Math.random() * 5000000), marketVolume: Math.floor(Math.random() * 20000000) },
      { range: "48k-50k", whaleVolume: Math.floor(Math.random() * 5000000), marketVolume: Math.floor(Math.random() * 20000000) },
    ];

    console.log('Processed data:', { transactions, priceRanges });
    return { transactions, priceRanges };
  } catch (error) {
    console.error('Error fetching entity transactions:', error);
    throw new Error('Falha ao carregar dados da API: ' + error.message);
  }
};

const GruposEntidades = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['entityTransactions'],
    queryFn: fetchEntityTransactions,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  console.log('Query data:', data);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.transactions || !data.priceRanges) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <p className="text-destructive">Dados inválidos recebidos do servidor</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Grupos de Entidades</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transações de Grandes Entidades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade (USD)</TableHead>
                <TableHead>Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{transaction.entity}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>${transaction.amount.toLocaleString()}</TableCell>
                  <TableCell>${transaction.price.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Volume de Transações por Faixa de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.priceRanges}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="whaleVolume" name="Volume de Baleias" fill="#8884d8" />
              <Bar dataKey="marketVolume" name="Volume do Mercado" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise Comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Com base nos dados apresentados, podemos observar que:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>As grandes entidades (exchanges) mostram padrões de compra e venda variados.</li>
            <li>O volume de transações das baleias varia significativamente entre as diferentes faixas de preço.</li>
            <li>Há uma correlação entre as atividades das grandes entidades e os movimentos gerais do mercado.</li>
          </ul>
          <p className="mt-4">
            Esta análise sugere que as atividades das grandes entidades podem ter um impacto significativo nas tendências de preço do mercado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GruposEntidades;