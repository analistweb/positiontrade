import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const MarketSentiment = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: async () => {
      // Simulated data - in production, this would come from an API
      return {
        overallSentiment: 'bullish',
        sentimentScore: 75,
        indicators: [
          { 
            name: 'Índice Medo & Ganância', 
            value: 65, 
            status: 'positive',
            description: 'Mercado em estado de ganância moderada, indicando otimismo dos investidores'
          },
          { 
            name: 'Menções em Redes Sociais', 
            value: '↑ 23%', 
            status: 'positive',
            description: 'Aumento significativo nas discussões sobre criptomoedas nas redes sociais'
          },
          { 
            name: 'Volume de Negociação', 
            value: '↓ 5%', 
            status: 'neutral',
            description: 'Leve queda no volume de negociações, indicando momento de cautela'
          },
          { 
            name: 'Interesse Institucional', 
            value: '↑ 15%', 
            status: 'positive',
            description: 'Crescimento no interesse de investidores institucionais, sugerindo confiança no mercado'
          }
        ]
      };
    },
    refetchInterval: 60000
  });

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
        <CardHeader>
          <CardTitle>Análise de Sentimento do Mercado</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
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
    <Card className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
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
                <span className="text-3xl font-bold">{data.sentimentScore}%</span>
              </div>
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-blue-500"
                  strokeDasharray={`${2 * Math.PI * 60 * data.sentimentScore / 100} ${2 * Math.PI * 60}`}
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.indicators.map((indicator, index) => (
              <motion.div
                key={indicator.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{indicator.name}</span>
                  {getSentimentIcon(indicator.status)}
                </div>
                <span className="text-xl font-semibold mb-2">{indicator.value}</span>
                <p className="text-sm text-gray-400 mt-2">{indicator.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSentiment;