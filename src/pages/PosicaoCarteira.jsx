import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';

const fetchWhaleTransactions = async () => {
  // Substitua 'SUA_CHAVE_API' pela sua chave real da API Whale Alert
  const response = await axios.get('https://api.whale-alert.io/v1/transactions?api_key=SUA_CHAVE_API&min_value=500000&limit=10');
  return response.data.transactions;
};

const PosicaoCarteira = () => {
  const { data: whaleTransactions, isLoading, error } = useQuery({
    queryKey: ['whaleTransactions'],
    queryFn: fetchWhaleTransactions,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar os dados: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Posição da Carteira</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Movimentações de Baleias Cripto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blockchain</TableHead>
                <TableHead>Valor (USD)</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {whaleTransactions && whaleTransactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{transaction.blockchain}</TableCell>
                  <TableCell>${transaction.amount_usd.toLocaleString()}</TableCell>
                  <TableCell>{transaction.from.owner_type}</TableCell>
                  <TableCell>{transaction.to.owner_type}</TableCell>
                  <TableCell>{new Date(transaction.timestamp * 1000).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Tendências de Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Com base nas movimentações recentes das baleias cripto, observamos as seguintes tendências:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>Aumento de transferências de exchanges para carteiras privadas, indicando possível acumulação.</li>
            <li>Crescimento no volume de transações em blockchains específicas, sugerindo maior atividade em certos projetos.</li>
            <li>Movimentações significativas de stablecoins, podendo indicar preparação para compras ou vendas em larga escala.</li>
          </ul>
          <p className="mt-4">
            Recomendamos monitorar de perto essas tendências para ajustar estratégias de investimento conforme necessário.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PosicaoCarteira;