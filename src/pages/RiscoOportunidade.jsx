import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SearchTrendsChart from '../components/dashboard/SearchTrendsChart';
import { toast } from "sonner";
import axios from 'axios';

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

  if (fundamentalLoading || newsLoading) {
    return <div>Carregando análises...</div>;
  }

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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Análise de Risco & Oportunidade</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
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
                <div key={index} className="p-3 bg-card/50 rounded-lg">
                  <p className="text-sm">{headline.title}</p>
                  <Badge variant={headline.sentiment === 'positive' ? 'success' : 'destructive'} className="mt-2">
                    {headline.sentiment === 'positive' ? 'Bullish' : 'Bearish'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
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
              <div className="p-4 bg-card/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Hashrate</span>
                  <Badge variant={fundamentalData.hashrate.trend === 'up' ? 'success' : 'destructive'}>
                    {fundamentalData.hashrate.trend === 'up' ? '↑' : '↓'} {fundamentalData.hashrate.current} EH/s
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Variação: {((fundamentalData.hashrate.current - fundamentalData.hashrate.previous) / fundamentalData.hashrate.previous * 100).toFixed(2)}%
                </p>
              </div>

              <div className="p-4 bg-card/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Transações por Dia</span>
                  <Badge variant={fundamentalData.transactions.trend === 'up' ? 'success' : 'destructive'}>
                    {fundamentalData.transactions.trend === 'up' ? '↑' : '↓'} {fundamentalData.transactions.current.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Variação: {((fundamentalData.transactions.current - fundamentalData.transactions.previous) / fundamentalData.transactions.previous * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiscoOportunidade;