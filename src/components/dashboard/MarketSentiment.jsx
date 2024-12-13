import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import axios from 'axios';
import SentimentGauge from './SentimentGauge';
import SentimentIndicator from './SentimentIndicator';
import { calculateSentimentScore } from '../../utils/sentimentCalculator';

const MarketSentiment = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: async () => {
      try {
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
            <SentimentGauge score={data.sentimentScore} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.indicators.map((indicator, index) => (
              <SentimentIndicator key={indicator.name} indicator={indicator} index={index} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSentiment;