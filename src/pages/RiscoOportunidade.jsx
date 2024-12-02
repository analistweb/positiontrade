import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchTrendsChart from '../components/dashboard/SearchTrendsChart';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const RiscoOportunidade = () => {
  const { data: fundamentalData, isLoading: fundamentalLoading } = useQuery({
    queryKey: ['bitcoinFundamentals'],
    queryFn: async () => {
      try {
        // Simulated data - in production, this would come from a real API
        return {
          hashrate: {
            current: 512,
            previous: 490,
            trend: 'up'
          },
          transactions: {
            current: 350000,
            previous: 320000,
            trend: 'up'
          },
          lastUpdate: new Date().toISOString()
        };
      } catch (error) {
        toast.error("Erro ao carregar dados fundamentalistas");
        throw error;
      }
    },
    refetchInterval: 300000 // 5 minutos
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['cnbcNews'],
    queryFn: async () => {
      try {
        // Simulated data - in production, this would come from a news API
        return {
          headlines: [
            {
              title: "Bitcoin reaches new heights",
              sentiment: "positive",
              date: new Date().toISOString()
            },
            {
              title: "Crypto market shows resilience",
              sentiment: "positive",
              date: new Date().toISOString()
            }
          ],
          sentimentScore: 75
        };
      } catch (error) {
        toast.error("Erro ao carregar manchetes");
        throw error;
      }
    },
    refetchInterval: 300000
  });

  const getRecommendation = (data) => {
    if (!data) return { text: "Aguardando dados", type: "neutral" };
    
    const { hashrate, transactions } = data;
    if (hashrate.trend === 'up' && transactions.trend === 'up') {
      return { text: "COMPRAR", type: "success" };
    } else if (hashrate.trend === 'down' && transactions.trend === 'down') {
      return { text: "VENDER", type: "destructive" };
    }
    return { text: "NEUTRO", type: "warning" };
  };

  const fundamentalRecommendation = getRecommendation(fundamentalData);

  if (fundamentalLoading || newsLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Análise de Risco & Oportunidade</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6"
      >
        Análise de Risco & Oportunidade
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Análise de Sentimento
                <Badge variant={newsData?.sentimentScore > 50 ? "success" : "destructive"}>
                  {newsData?.sentimentScore}% Positivo
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <SearchTrendsChart />
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Últimas Manchetes CNBC:</h3>
                {newsData?.headlines.map((headline, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
                  >
                    <p className="text-sm">{headline.title}</p>
                    <Badge 
                      variant={headline.sentiment === 'positive' ? 'success' : 'destructive'} 
                      className="mt-2"
                    >
                      {headline.sentiment === 'positive' ? 'Bullish' : 'Bearish'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Análise Fundamentalista
                <Badge variant={fundamentalRecommendation.type}>
                  {fundamentalRecommendation.text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <motion.div 
                  className="p-6 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Hashrate</span>
                    <Badge variant={fundamentalData.hashrate.trend === 'up' ? 'success' : 'destructive'}>
                      {fundamentalData.hashrate.trend === 'up' ? '↑' : '↓'} {fundamentalData.hashrate.current} EH/s
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Variação: {((fundamentalData.hashrate.current - fundamentalData.hashrate.previous) / fundamentalData.hashrate.previous * 100).toFixed(2)}%
                  </p>
                </motion.div>

                <motion.div 
                  className="p-6 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Transações por Dia</span>
                    <Badge variant={fundamentalData.transactions.trend === 'up' ? 'success' : 'destructive'}>
                      {fundamentalData.transactions.trend === 'up' ? '↑' : '↓'} {fundamentalData.transactions.current.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Variação: {((fundamentalData.transactions.current - fundamentalData.transactions.previous) / fundamentalData.transactions.previous * 100).toFixed(2)}%
                  </p>
                </motion.div>

                <div className="text-sm text-muted-foreground text-right mt-4">
                  Última atualização: {new Date(fundamentalData.lastUpdate).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RiscoOportunidade;