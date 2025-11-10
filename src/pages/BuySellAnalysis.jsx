import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';
import { toast } from "sonner";
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import VolumeComparisonCard from '../components/buysell/VolumeComparisonCard';

const BuySellAnalysis = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['buySellVolumes'],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${COINGECKO_API_URL}/coins/bitcoin/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days: 1,
              interval: 'hourly'
            },
            headers: getHeaders()
          }
        );

        const prices = response.data.prices;
        const volumes = response.data.total_volumes;
        const priceRanges = {};
        let totalBuyVolume = 0;
        let totalSellVolume = 0;

        // Processando os dados em faixas de preço
        for (let i = 0; i < prices.length - 1; i++) {
          const currentPrice = prices[i][1];
          const nextPrice = prices[i + 1][1];
          const volume = volumes[i][1];
          
          const priceRange = `${Math.floor(currentPrice/10000)}0k-${Math.ceil(nextPrice/10000)}0k`;
          
          if (!priceRanges[priceRange]) {
            priceRanges[priceRange] = { buy: 0, sell: 0 };
          }

          if (nextPrice > currentPrice) {
            priceRanges[priceRange].buy += volume;
            totalBuyVolume += volume;
          } else {
            priceRanges[priceRange].sell += volume;
            totalSellVolume += volume;
          }
        }

        const chartData = Object.entries(priceRanges).map(([price, volumes]) => ({
          price,
          buy: volumes.buy,
          sell: volumes.sell
        }));

        return {
          chartData,
          totalBuyVolume,
          totalSellVolume
        };
      } catch (error) {
        toast.error('Erro ao carregar dados de volume');
        throw error;
      }
    },
    refetchInterval: 60000 // Atualiza a cada minuto
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen p-4 items-center justify-center">
        <LoadingSpinner message="Carregando análise de volume..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen p-4">
        <ErrorDisplay
          title="Erro ao carregar análise"
          message={error.message}
        />
      </div>
    );
  }

  const formatVolume = (volume) => {
    return `$${(volume / 1e9).toFixed(2)}B`;
  };

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Análise de Compra/Venda</h1>
        <DataSourceBadge isRealData={true} size="md" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Volume de Compra/Venda por Faixa de Preço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="price" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="buy" fill="#22c55e" name="Volume de Compra" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="sell" fill="#ef4444" name="Volume de Venda" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <VolumeComparisonCard 
            totalBuyVolume={data.totalBuyVolume}
            totalSellVolume={data.totalSellVolume}
          />
        </div>
      </div>
    </div>
  );
};

export default BuySellAnalysis;