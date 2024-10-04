import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { preco: '0-50k', compra: 4000, venda: 2400 },
  { preco: '50k-100k', compra: 3000, venda: 1398 },
  { preco: '100k-150k', compra: 2000, venda: 9800 },
  { preco: '150k-200k', compra: 2780, venda: 3908 },
  { preco: '200k-250k', compra: 1890, venda: 4800 },
  { preco: '250k+', compra: 2390, venda: 3800 },
];

const AnalisesCompraVenda = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Análise de Compra/Venda</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Volume de Compra/Venda por Faixa de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="preco" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="compra" fill="#82ca9d" />
              <Bar dataKey="venda" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Volume Total de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ 80,3 B</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Volume Total de Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ 130,55 B</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalisesCompraVenda;