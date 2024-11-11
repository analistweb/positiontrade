import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";

const CBBIIndicator = () => {
  const { data: cbbiData, isLoading, error } = useQuery({
    queryKey: ['cbbi'],
    queryFn: async () => {
      // Simulated CBBI calculation based on multiple metrics
      // In a real implementation, this would fetch from an API
      const value = Math.random() * 100;
      return {
        value: value.toFixed(2),
        confidence: value > 80 ? 'Alta' : value > 40 ? 'Média' : 'Baixa',
        marketPhase: value > 80 ? 'Topo de Mercado' : value > 40 ? 'Meio de Ciclo' : 'Fundo de Mercado'
      };
    },
    refetchInterval: 60000, // Atualiza a cada minuto
    onError: (error) => {
      toast.error(`Erro ao atualizar CBBI: ${error.message}`);
    }
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Índice CBBI</span>
          {!isLoading && !error && (
            <span className="text-sm font-normal text-muted-foreground">
              Atualizado em tempo real
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
              O CBBI é um índice que utiliza 9 métricas para análise do ciclo do Bitcoin.
              Desenvolvido por Colin e Kamil, é 100% código aberto e gratuito.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CBBIIndicator;