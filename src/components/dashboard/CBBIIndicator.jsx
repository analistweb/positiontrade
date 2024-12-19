import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import { Tooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { fetchCBBIData } from '../../services/marketService';

const CBBIIndicator = () => {
  const { data: cbbiData, isLoading, error } = useQuery({
    queryKey: ['cbbi'],
    queryFn: fetchCBBIData,
    refetchInterval: 60000,
    onError: (error) => {
      toast.error(`Erro ao atualizar CBBI: ${error.message}`);
    }
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Índice CBBI</span>
            <Tooltip content="O CBBI é calculado usando métricas como capitalização de mercado, volume e variação de preço">
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </Tooltip>
          </div>
          {!isLoading && !error && (
            <span className="text-sm font-normal text-muted-foreground">
              Atualizado em: {cbbiData?.lastUpdate}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        ) : error ? (
          <div className="text-red-500">Erro ao carregar dados do CBBI</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Pontuação CBBI</span>
                <span className="text-sm font-medium">{cbbiData.value}%</span>
              </div>
              <Progress value={parseFloat(cbbiData.value)} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Confiança</p>
                <p className="text-lg font-semibold">{cbbiData.confidence}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fase do Mercado</p>
                <p className="text-lg font-semibold">{cbbiData.marketPhase}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              <p>O CBBI é um índice que utiliza métricas reais do mercado para análise do ciclo do Bitcoin.</p>
              <p>Os dados são atualizados a cada minuto com informações do CoinGecko.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CBBIIndicator;