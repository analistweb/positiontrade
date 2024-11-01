import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const fetchLiquidationData = async () => {
  // Simulando dados de liquidação já que precisaríamos de uma API key real
  return {
    liquidations: [
      { exchange: 'Binance', amount: 125000000, type: 'long', timestamp: new Date().getTime() - 3600000 },
      { exchange: 'Bybit', amount: 75000000, type: 'short', timestamp: new Date().getTime() - 7200000 },
      { exchange: 'OKX', amount: 50000000, type: 'long', timestamp: new Date().getTime() - 10800000 },
    ],
    totalLiquidated: 250000000,
    longVsShort: { long: 60, short: 40 }
  };
};

const fetchMarketSentiment = async () => {
  // Simulando dados de sentimento do mercado
  return {
    overallSentiment: 65, // 0-100, onde >50 é positivo
    socialMediaMentions: [
      { platform: 'Twitter', sentiment: 70, volume: 50000 },
      { platform: 'Reddit', sentiment: 60, volume: 30000 },
      { platform: 'Telegram', sentiment: 65, volume: 20000 }
    ],
    fearGreedIndex: 55 // 0-100
  };
};

const fetchMarketNews = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/news');
    return response.data;
  } catch (error) {
    // Dados simulados em caso de erro ou limite de API
    return [
      {
        title: "Bitcoin atinge nova máxima histórica",
        url: "#",
        source: "CoinDesk",
        published_at: new Date().toISOString()
      },
      {
        title: "ETH 2.0 alcança novo marco",
        url: "#",
        source: "CryptoNews",
        published_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }
};

const LiquidacoesMercado = () => {
  const { data: liquidationData, isLoading: isLoadingLiquidations } = useQuery({
    queryKey: ['liquidationData'],
    queryFn: fetchLiquidationData,
    refetchInterval: 300000,
  });

  const { data: sentimentData, isLoading: isLoadingSentiment } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchMarketSentiment,
    refetchInterval: 300000,
  });

  const { data: newsData, isLoading: isLoadingNews } = useQuery({
    queryKey: ['marketNews'],
    queryFn: fetchMarketNews,
    refetchInterval: 300000,
  });

  if (isLoadingLiquidations || isLoadingSentiment || isLoadingNews) {
    return <div className="container mx-auto p-4">Carregando dados do mercado...</div>;
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
            <p className="text-2xl font-bold">${(liquidationData.totalLiquidated / 1000000).toFixed(2)}M</p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor (USD)</TableHead>
                  <TableHead>Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidationData.liquidations.map((liq, index) => (
                  <TableRow key={index}>
                    <TableCell>{liq.exchange}</TableCell>
                    <TableCell>
                      <span className={liq.type === 'long' ? 'text-green-500' : 'text-red-500'}>
                        {liq.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>${(liq.amount / 1000000).toFixed(2)}M</TableCell>
                    <TableCell>{new Date(liq.timestamp).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentimento nas Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sentimentData.socialMediaMentions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sentiment" name="Sentimento %" fill="#8884d8" />
                <Bar dataKey="volume" name="Volume" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Notícias do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {newsData.map((news, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  <h3 className="font-semibold mb-1">{news.title}</h3>
                  <div className="text-sm text-muted-foreground">
                    <span>{news.source}</span> • 
                    <span className="ml-2">
                      {new Date(news.published_at).toLocaleDateString()}
                    </span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiquidacoesMercado;