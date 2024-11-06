import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLiquidationsData } from '../services/cryptoService';
import LiquidationTable from '../components/market/LiquidationTable';
import { toast } from "sonner";

const LiquidacoesMercado = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['liquidations'],
    queryFn: fetchLiquidationsData,
    refetchInterval: 60000,
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  });

  if (isLoading) return <div className="p-4">Carregando dados...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error.message}</div>;
  if (!data) return <div className="p-4">Nenhum dado disponível</div>;

  const {
    totalLiquidated = 0,
    longLiquidated = 0,
    shortLiquidated = 0,
    liquidations = []
  } = data;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Liquidações do Mercado</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Liquidado (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(totalLiquidated / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Liquidações Long</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              ${(longLiquidated / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liquidações Short</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              ${(shortLiquidated / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Liquidações</CardTitle>
        </CardHeader>
        <CardContent>
          <LiquidationTable liquidations={liquidations} />
        </CardContent>
      </Card>
    </div>
  );
};

export default LiquidacoesMercado;