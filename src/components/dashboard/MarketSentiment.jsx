import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import axios from 'axios';
import SentimentGauge from './SentimentGauge';
import SentimentIndicator from './SentimentIndicator';
import { calculateSentimentScore } from '../../utils/sentimentCalculator';
import { toast } from "sonner";
import { COINGECKO_API_URL, getHeaders, handleApiError } from '../../config/api';

const MarketSentiment = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: true,
            developer_data: false,
            sparkline: false
          },
          headers: getHeaders()
        });

        const marketData = response.data;
        
        if (!marketData.market_data) {
          throw new Error('Dados de mercado não disponíveis');
        }

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
              value: `${marketData.community_data?.twitter_followers?.toLocaleString() || '0'}`,
              status: 'positive',
              description: 'Total de seguidores no Twitter como indicador de interesse social'
            },
            {
              name: 'Dominância de Mercado',
              value: `${marketData.market_data.market_cap_percentage?.toFixed(2) || '0'}%`,
              status: marketData.market_data.market_cap_change_percentage_24h > 0 ? 'positive' : 'negative',
              description: 'Percentual de dominância do Bitcoin no mercado'
            },
            {
              name: 'Variação de Preço 24h',
              value: `${marketData.market_data.price_change_percentage_24h?.toFixed(2) || '0'}%`,
              status: marketData.market_data.price_change_percentage_24h > 0 ? 'positive' : 'negative',
              description: 'Variação percentual do preço nas últimas 24 horas'
            }
          ]
        };
      } catch (error) {
        const handledError = handleApiError(error, 'buscar dados de sentimento');
        toast.error(handledError.message);
        
        // Retorna dados mockados em caso de erro
        return {
          overallSentiment: 'neutral',
          sentimentScore: 50,
          indicators: [
            {
              name: 'Volume de Mercado 24h',
              value: '30B USD',
              status: 'neutral',
              description: 'Volume total de negociação nas últimas 24 horas'
            },
            {
              name: 'Menções em Redes Sociais',
              value: '1M+',
              status: 'neutral',
              description: 'Total de seguidores no Twitter como indicador de interesse social'
            },
            {
              name: 'Dominância de Mercado',
              value: '45%',
              status: 'neutral',
              description: 'Percentual de dominância do Bitcoin no mercado'
            },
            {
              name: 'Variação de Preço 24h',
              value: '0%',
              status: 'neutral',
              description: 'Variação percentual do preço nas últimas 24 horas'
            }
          ]
        };
      }
    },
    refetchInterval: 300000 // 5 minutos
  });

  if (error) {
    return (
      <Card className="w-full bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Análise de Sentimento do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            Erro ao carregar dados. Por favor, tente novamente mais tarde.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
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