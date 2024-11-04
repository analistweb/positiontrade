import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fetchLiquidationData, fetchMarketSentiment, fetchMarketNews } from '../services/api';
import LiquidationTable from '../components/market/LiquidationTable';
import SentimentChart from '../components/market/SentimentChart';
import NewsSection from '../components/market/NewsSection';
import { toast } from "sonner";

const MarketDataCard = ({ title, children }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const LiquidacoesMercado = () => {
  const { 
    data: liquidationData, 
    isLoading: isLoadingLiquidations, 
    error: liquidationError 
  } = useQuery({
    queryKey: ['liquidationData'],
    queryFn: fetchLiquidationData,
    refetchInterval: 60000,
    retry: 3,
    onError: () => toast.error("Erro ao carregar dados de liquidação")
  });

  const { 
    data: sentimentData, 
    isLoading: isLoadingSentiment, 
    error: sentimentError 
  } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchMarketSentiment,
    refetchInterval: 300000,
    retry: 3,
    onError: () => toast.error("Erro ao carregar dados de sentimento")
  });

  const { 
    data: newsData, 
    isLoading: isLoadingNews, 
    error: newsError 
  } = useQuery({
    queryKey: ['marketNews'],
    queryFn: fetchMarketNews,
    refetchInterval: 300000,
    retry: 3,
    onError: () => toast.error("Erro ao carregar notícias")
  });

  if (isLoadingLiquidations || isLoadingSentiment || isLoadingNews) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando dados do mercado...</div>
      </div>
    );
  }

  if (liquidationError || sentimentError || newsError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="text-red-500 mb-2">Ocorreu um erro ao carregar os dados</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const defaultData = {
    liquidationData: {
      totalLiquidated: 0,
      liquidations: [],
      longShortRate: 0
    },
    sentimentData: {
      overallSentiment: 0,
      fearGreedIndex: 0,
      socialMediaMentions: []
    }
  };

  const safeData = {
    liquidationData: liquidationData || defaultData.liquidationData,
    sentimentData: sentimentData || defaultData.sentimentData,
    newsData: newsData || []
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Liquidações e Sentimento do Mercado</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MarketDataCard title="Total Liquidado (24h)">
          <p className="text-2xl font-bold">
            ${(safeData.liquidationData.totalLiquidated / 1000000).toFixed(2)}M
          </p>
        </MarketDataCard>

        <MarketDataCard title="Índice Medo e Ganância">
          <p className="text-2xl font-bold">{safeData.sentimentData.fearGreedIndex}</p>
          <p className="text-sm text-muted-foreground">
            {safeData.sentimentData.fearGreedIndex > 50 ? 'Ganância' : 'Medo'}
          </p>
        </MarketDataCard>

        <MarketDataCard title="Sentimento Geral">
          <div className="flex items-center">
            {safeData.sentimentData.overallSentiment > 50 ? (
              <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500 mr-2" />
            )}
            <p className="text-2xl font-bold">{safeData.sentimentData.overallSentiment}%</p>
          </div>
        </MarketDataCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MarketDataCard title="Últimas Liquidações">
          <LiquidationTable liquidations={safeData.liquidationData.liquidations} />
        </MarketDataCard>

        <MarketDataCard title="Sentimento nas Redes Sociais">
          <SentimentChart data={safeData.sentimentData.socialMediaMentions} />
        </MarketDataCard>
      </div>

      <MarketDataCard title="Últimas Notícias do Mercado">
        <NewsSection news={safeData.newsData} />
      </MarketDataCard>
    </div>
  );
};

export default LiquidacoesMercado;