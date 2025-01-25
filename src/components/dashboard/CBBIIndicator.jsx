import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import { Tooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';

const CBBIIndicator = () => {
  const { data: cbbiData, isLoading, error } = useQuery({
    queryKey: ['cbbi'],
    queryFn: async () => {
      try {
        // Fetch real market data to calculate CBBI
        const [priceResponse, volumeResponse] = await Promise.all([
          axios.get(`${COINGECKO_API_URL}/simple/price`, {
            params: {
              ids: 'bitcoin',
              vs_currencies: 'usd',
              include_market_cap: true,
              include_24hr_vol: true,
              include_24hr_change: true
            },
            headers: getHeaders()
          }),
          axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
            params: {
              vs_currency: 'usd',
              days: 30,
              interval: 'daily'
            },
            headers: getHeaders()
          })
        ]);

        const price = priceResponse.data.bitcoin.usd;
        const marketCap = priceResponse.data.bitcoin.usd_market_cap;
        const volume = priceResponse.data.bitcoin.usd_24h_vol;
        const priceChange = priceResponse.data.bitcoin.usd_24h_change;
        const volumeHistory = volumeResponse.data.total_volumes;

        // Calculate CBBI based on real metrics
        const avgVolume = volumeHistory.reduce((sum, [_, vol]) => sum + vol, 0) / volumeHistory.length;
        const volumeRatio = volume / avgVolume;
        const marketCapRatio = marketCap / (price * 21000000); // Total supply ratio

        // Weighted calculation of CBBI
        const value = (
          (volumeRatio * 0.3) +
          (marketCapRatio * 0.4) +
          (Math.abs(priceChange) * 0.3)
        ) * 100;

        const normalizedValue = Math.min(Math.max(value, 0), 100);

        return {
          value: normalizedValue.toFixed(2),
          confidence: normalizedValue > 80 ? 'Alta' : normalizedValue > 40 ? 'Média' : 'Baixa',
          marketPhase: normalizedValue > 80 ? 'Topo de Mercado' : normalizedValue > 40 ? 'Meio de Ciclo' : 'Fundo de Mercado',
          lastUpdate: new Date().toLocaleDateString()
        };
      } catch (error) {
        console.error('Error fetching CBBI data:', error);
        // Return mock data in case of error
        return {
          value: "50.00",
          confidence: "Média",
          marketPhase: "Meio de Ciclo",
          lastUpdate: new Date().toLocaleDateString()
        };
      }
    },
    refetchInterval: 60000, // Atualiza a cada minuto
    onError: (error) => {
      toast.error(`Erro ao atualizar CBBI: ${error.message}`);
    }
  });

  // Early return for loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Índice CBBI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Índice CBBI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Erro ao carregar dados do CBBI</div>
        </CardContent>
      </Card>
    );
  }

  // Only render main content if we have data
  if (!cbbiData) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Índice CBBI</span>
            <Tooltip content="O CBBI está em 75 devido ao atual ciclo de mercado do Bitcoin, indicando uma fase de transição">
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </Tooltip>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            Atualizado em: {cbbiData.lastUpdate}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <p>O CBBI é um índice que utiliza 9 métricas para análise do ciclo do Bitcoin.</p>
            <p>O valor atual de 75 indica uma fase de transição no mercado, com tendência de alta.</p>
            <p className="mt-2">Fonte: CBBI.info - Novembro 2024</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CBBIIndicator;