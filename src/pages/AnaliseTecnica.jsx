import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders, API_CONFIG } from '@/config/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PageContainer } from '@/components/layout/PageContainer';

const AnaliseTecnica = () => {
  const { data: btcData, isLoading, error } = useQuery({
    queryKey: ['btcTechnicalAnalysis'],
    queryFn: async () => {
      try {
        console.log('Iniciando chamada à API do CoinGecko...');
        const response = await axios.get(
          `${COINGECKO_API_URL}/coins/bitcoin/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days: 365,
              interval: 'daily'
            },
            headers: getHeaders()
          }
        );

        console.log('Resposta da API:', response.data);

        if (!response.data?.prices || !Array.isArray(response.data.prices)) {
          console.error('Dados de preço inválidos:', response.data);
          throw new Error('Dados de preço não disponíveis ou em formato inválido');
        }

        const prices = response.data.prices.map(price => ({
          date: new Date(price[0]).toLocaleDateString(),
          price: price[1]
        }));

        // Calcular 200MMA
        const mma200 = prices.slice(-200).reduce((sum, p) => sum + p.price, 0) / 200;
        const mayerMultiple = prices[prices.length - 1].price / mma200;

        console.log('Dados processados com sucesso:', { 
          pricesLength: prices.length, 
          mma200, 
          mayerMultiple 
        });

        return {
          prices,
          mma200,
          mayerMultiple
        };
      } catch (error) {
        console.error('Erro detalhado:', error);
        const errorMessage = error.response?.data?.error || error.message;
        toast.error(`Erro ao carregar dados do Bitcoin: ${errorMessage}`);
        throw error;
      }
    },
    retry: API_CONFIG.RETRY_COUNT,
    staleTime: API_CONFIG.STALE_TIME,
    cacheTime: API_CONFIG.CACHE_TIME,
    refetchInterval: API_CONFIG.REFETCH_INTERVAL
  });

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorDisplay 
          title="Erro na Análise Técnica" 
          message={error.message || "Erro ao carregar dados. Tente novamente mais tarde."} 
        />
      </PageContainer>
    );
  }

  if (!btcData?.prices || !Array.isArray(btcData.prices)) {
    return (
      <PageContainer>
        <ErrorDisplay 
          title="Dados Indisponíveis" 
          message="Não foi possível carregar os dados da análise técnica." 
        />
      </PageContainer>
    );
  }

  const getSignalColor = (value, threshold) => {
    if (value === undefined || threshold === undefined) return 'bg-gray-500';
    return value >= threshold ? 'bg-red-500' : 'bg-green-500';
  };

  const currentPrice = btcData.prices[btcData.prices.length - 1]?.price;
  const mma200 = btcData.mma200;
  const mayerMultiple = btcData.mayerMultiple;

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold mb-6">Análise Técnica Bitcoin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Indicador 200MMA
              <Badge 
                variant={currentPrice > (mma200 * 2) ? 'destructive' : 'success'}
              >
                {currentPrice > (mma200 * 2) ? 'Venda' : 'Compra'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>200MMA: ${mma200?.toLocaleString() ?? 'N/A'}</p>
            <p>Preço Atual: ${currentPrice?.toLocaleString() ?? 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Mayer Multiple
              <Badge 
                variant={mayerMultiple > 2.4 ? 'destructive' : mayerMultiple < 1.3 ? 'success' : 'secondary'}
              >
                {mayerMultiple > 2.4 ? 'Venda' : mayerMultiple < 1.3 ? 'Compra' : 'Neutro'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Valor Atual: {mayerMultiple?.toFixed(2) ?? 'N/A'}</p>
            <p>Referência Compra: 1.3</p>
            <p>Referência Venda: 2.4</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Gráfico de Preço e 200MMA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={btcData.prices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8884d8" 
                  name="Preço BTC"
                />
                <Line 
                  type="monotone" 
                  dataKey={() => btcData.mma200} 
                  stroke="#82ca9d" 
                  name="200MMA"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AnaliseTecnica;