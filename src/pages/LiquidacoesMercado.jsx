import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLiquidationData } from '../services/api';
import LiquidationTable from '../components/market/LiquidationTable';
import { toast } from "sonner";

const LiquidacoesMercado = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['liquidations'],
    queryFn: fetchLiquidationData,
    refetchInterval: 30000,
    onSuccess: () => {
      toast.success("Dados de liquidações atualizados");
    },
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Erro ao carregar dados</h2>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const {
    totalLiquidated = 0,
    longLiquidated = 0,
    shortLiquidated = 0,
    liquidations = []
  } = data || {};

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Liquidações do Mercado</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Total Liquidado (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(totalLiquidated / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Liquidações Long</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              ${(longLiquidated / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Liquidações Short</CardTitle>
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