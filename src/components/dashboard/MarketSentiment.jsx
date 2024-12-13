import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import axios from 'axios';

const MarketSentiment = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: async () => {
      try {
        // Buscar dados do Bitcoin como referência de mercado
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin', {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: true,
            developer_data: false,
            sparkline: false
          }
        });

        const marketData = response.data;
        
        // Calcular score de sentimento baseado em métricas reais
        const sentimentScore = calculateSentimentScore(marketData);
        
        return {
          overallSentiment: sentimentScore > 50 ? 'bullish' : 'bearish',
          sentimentScore,
          indicators: [
            {
              name: 'Volume de Mercado 24h',
              value: `${(marketData.market_data.total_volume.usd / 1000000000).toFixed(2)}B USD`,
              status: marketData.market_data.price_change_percentage_24h > 0 ? 'positive' : 'negative',
              description: `Volume total de negociação nas últimas 24 horas`
            },
            {
              name: 'Menções em Redes Sociais',
              value: `${marketData.community_data.twitter_followers.toLocaleString()}`,
              status: 'positive',
              description: 'Total de seguidores no Twitter como indicador de interesse social'
            },
            {
              name: 'Dominância de Mercado',
              value: `${marketData.market_data.market_cap_percentage.toFixed(2)}%`,
              status: marketData.market_data.market_cap_change_percentage_24h > 0 ? 'positive' : 'negative',
              description: 'Percentual de dominância do Bitcoin no mercado'
            },
            {
              name: 'Variação de Preço 24h',
              value: `${marketData.market_data.price_change_percentage_24h.toFixed(2)}%`,
              status: marketData.market_data.price_change_percentage_24h > 0 ? 'positive' : 'negative',
              description: 'Variação percentual do preço nas últimas 24 horas'
            }
          ]
        };
      } catch (error) {
        console.error('Erro ao buscar dados de sentimento:', error);
        throw error;
      }
    },
    refetchInterval: 300000 // 5 minutos
  });

  const calculateSentimentScore = (marketData) => {
    let score = 50; // Score base

    // Ajusta score baseado na variação de preço
    if (marketData.market_data.price_change_percentage_24h > 0) {
      score += 10;
    } else {
      score -= 10;
    }

    // Ajusta score baseado no volume
    if (marketData.market_data.total_volume.usd > marketData.market_data.market_cap.usd * 0.1) {
      score += 10;
    }

    // Ajusta score baseado na dominância
    if (marketData.market_data.market_cap_percentage > 45) {
      score += 10;
    }

    // Limita o score entre 0 e 100
    return Math.max(0, Math.min(100, score));
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Análise de Sentimento do Mercado</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
        </CardContent>
      </Card>
    );
  }

  const getSentimentIcon = (status) => {
    switch (status) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="w-full bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Análise de Sentimento do Mercado</span>
          <Badge variant={data.overallSentiment === 'bullish' ? 'success' : 'destructive'}>
            {data.overallSentiment === 'bullish' ? 'Otimista' : 'Pessimista'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{data.sentimentScore}%</span>
              </div>
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-primary"
                  strokeDasharray={`${2 * Math.PI * 60 * data.sentimentScore / 100} ${2 * Math.PI * 60}`}
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.indicators.map((indicator, index) => (
              <motion.div
                key={indicator.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card/50 p-4 rounded-lg border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{indicator.name}</span>
                  {getSentimentIcon(indicator.status)}
                </div>
                <span className="text-xl font-semibold text-foreground mb-2">{indicator.value}</span>
                <p className="text-sm text-muted-foreground mt-2">{indicator.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSentiment;