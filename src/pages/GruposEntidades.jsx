import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// API fictícia para simular dados de transações de grandes entidades
const fetchEntityTransactions = async () => {
  // Em um cenário real, você substituiria isso por uma chamada à API real
  return {
    transactions: [
      { entity: "Whale1", type: "Compra", amount: 1000000, price: 45000 },
      { entity: "Whale2", type: "Venda", amount: 800000, price: 46000 },
      { entity: "Whale3", type: "Compra", amount: 1200000, price: 44000 },
      { entity: "Whale4", type: "Venda", amount: 900000, price: 47000 },
      { entity: "Whale5", type: "Compra", amount: 1500000, price: 43000 },
    ],
    priceRanges: [
      { range: "40k-42k", whaleVolume: 2000000, marketVolume: 10000000 },
      { range: "42k-44k", whaleVolume: 3000000, marketVolume: 15000000 },
      { range: "44k-46k", whaleVolume: 4000000, marketVolume: 20000000 },
      { range: "46k-48k", whaleVolume: 2500000, marketVolume: 12000000 },
      { range: "48k-50k", whaleVolume: 1500000, marketVolume: 8000000 },
    ]
  };
};

const GruposEntidades = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['entityTransactions'],
    queryFn: fetchEntityTransactions,
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar os dados: {error.message}</div>;

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
            <li>As grandes entidades (baleias) têm uma preferência por transações na faixa de preço de 44k-46k USD.</li>
            <li>O volume de transações das baleias representa aproximadamente 20% do volume total do mercado.</li>
            <li>Há uma correlação entre as atividades das baleias e os movimentos gerais do mercado, especialmente nas faixas de preço mais altas.</li>
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