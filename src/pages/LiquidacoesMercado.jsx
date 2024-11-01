import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fetchLiquidationData, fetchMarketSentiment, fetchMarketNews } from '../services/api';
import LiquidationTable from '../components/market/LiquidationTable';
import SentimentChart from '../components/market/SentimentChart';
import NewsSection from '../components/market/NewsSection';
import { toast } from "sonner";

const LiquidacoesMercado = () => {
  const { data: liquidationData, isLoading: isLoadingLiquidations, error: liquidationError } = useQuery({
    queryKey: ['liquidationData'],
    queryFn: fetchLiquidationData,
    refetchInterval: 60000, // Atualiza a cada minuto
    onError: () => toast.error("Erro ao carregar dados de liquidação")
  });

  const { data: sentimentData, isLoading: isLoadingSentiment, error: sentimentError } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchMarketSentiment,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    onError: () => toast.error("Erro ao carregar dados de sentimento")
  });

  const { data: newsData, isLoading: isLoadingNews, error: newsError } = useQuery({
    queryKey: ['marketNews'],
    queryFn: fetchMarketNews,
    refetchInterval: 300000,
    onError: () => toast.error("Erro ao carregar notícias")
  });

  if (isLoadingLiquidations || isLoadingSentiment || isLoadingNews) {
    return <div className="container mx-auto p-4">Carregando dados do mercado...</div>;
  }

  if (liquidationError || sentimentError || newsError) {
    return <div className="container mx-auto p-4">Erro ao carregar dados. Por favor, tente novamente.</div>;
  }

  // Ensure data exists before rendering
  if (!liquidationData || !sentimentData) {
    return <div className="container mx-auto p-4">Dados não disponíveis no momento.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Liquidações e Sentimento do Mercado</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Liquidado (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(liquidationData.totalLiquidated / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Índice Medo e Ganância</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sentimentData.fearGreedIndex}</p>
            <p className="text-sm text-muted-foreground">
              {sentimentData.fearGreedIndex > 50 ? 'Ganância' : 'Medo'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sentimento Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {sentimentData.overallSentiment > 50 ? (
                <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500 mr-2" />
              )}
              <p className="text-2xl font-bold">{sentimentData.overallSentiment}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Liquidações</CardTitle>
          </CardHeader>
          <CardContent>
            <LiquidationTable liquidations={liquidationData.liquidations || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentimento nas Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentChart data={sentimentData.socialMediaMentions || []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Notícias do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <NewsSection news={newsData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default LiquidacoesMercado;