import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';

const AnaliseTecnica = () => {
  const { data: btcData, isLoading } = useQuery({
    queryKey: ['btcTechnicalAnalysis'],
    queryFn: async () => {
      try {
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

        const prices = response.data.prices.map(price => ({
          date: new Date(price[0]).toLocaleDateString(),
          price: price[1]
        }));

        // Calcular 200MMA
        const mma200 = prices.slice(-200).reduce((sum, p) => sum + p.price, 0) / 200;
        const mayerMultiple = prices[prices.length - 1].price / mma200;

        return {
          prices,
          mma200,
          mayerMultiple
        };
      } catch (error) {
        toast.error("Erro ao carregar dados do Bitcoin");
        throw error;
      }
    },
    refetchInterval: 300000 // 5 minutos
  });

  if (isLoading) {
    return <div>Carregando análise técnica...</div>;
  }

  const getSignalColor = (value, threshold) => {
    return value >= threshold ? 'bg-red-500' : 'bg-green-500';
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Análise Técnica Bitcoin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Indicador 200MMA
              <Badge 
                className={getSignalColor(btcData.prices[btcData.prices.length - 1].price, btcData.mma200 * 2)}
              >
                {btcData.prices[btcData.prices.length - 1].price > btcData.mma200 * 2 ? 'Venda' : 'Compra'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>200MMA: ${btcData.mma200.toLocaleString()}</p>
            <p>Preço Atual: ${btcData.prices[btcData.prices.length - 1].price.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Mayer Multiple
              <Badge 
                className={getSignalColor(btcData.mayerMultiple, 2.4)}
              >
                {btcData.mayerMultiple > 2.4 ? 'Venda' : btcData.mayerMultiple < 1.3 ? 'Compra' : 'Neutro'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Valor Atual: {btcData.mayerMultiple.toFixed(2)}</p>
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
    </div>
  );
};

export default AnaliseTecnica;