import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';
import { motion } from "framer-motion";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AnaliseTecnica = () => {
  const { data: btcData, isLoading, error } = useQuery({
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

        if (!response.data || !response.data.prices) {
          console.error('Invalid response data:', response.data);
          throw new Error('Dados inválidos recebidos da API');
        }

        const prices = response.data.prices.map(price => ({
          date: new Date(price[0]).toLocaleDateString(),
          price: price[1]
        }));

        const mma200 = prices.slice(-200).reduce((sum, p) => sum + p.price, 0) / 200;
        const mayerMultiple = prices[prices.length - 1].price / mma200;

        return {
          prices,
          mma200,
          mayerMultiple
        };
      } catch (error) {
        console.error('Erro ao carregar dados do Bitcoin:', error);
        toast.error("Erro ao carregar dados do Bitcoin");
        throw error;
      }
    },
    refetchInterval: 300000
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4" role="status" aria-label="Carregando dados do Bitcoin">
        <Card className="w-full">
          <CardContent className="h-[300px] flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !btcData || !btcData.prices) {
    return (
      <div className="container mx-auto p-4" role="alert">
        <Card className="w-full">
          <CardContent className="p-6">
            <p className="text-destructive text-center">
              Erro ao carregar dados. Por favor, tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSignalColor = (value, threshold) => {
    return value >= threshold ? 'bg-red-500' : 'bg-green-500';
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-6" role="heading" aria-level="1">Análise Técnica Bitcoin</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Indicador 200MMA</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>A Média Móvel de 200 dias (200MMA) é um indicador técnico que ajuda a identificar a tendência de longo prazo do Bitcoin. 
                    Quando o preço está acima da 200MMA, indica tendência de alta; abaixo, tendência de baixa.</p>
                  </TooltipContent>
                </UITooltip>
                <Badge 
                  className={getSignalColor(btcData.prices[btcData.prices.length - 1].price, btcData.mma200 * 2)}
                  role="status"
                  aria-label={`Sinal atual: ${btcData.prices[btcData.prices.length - 1].price > btcData.mma200 * 2 ? 'Venda' : 'Compra'}`}
                >
                  {btcData.prices[btcData.prices.length - 1].price > btcData.mma200 * 2 ? 'Venda' : 'Compra'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center cursor-help">
                      <span>200MMA:</span>
                      <span>${btcData.mma200.toLocaleString()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Este é o valor médio do Bitcoin nos últimos 200 dias. É uma referência importante para análise de tendência de longo prazo.</p>
                  </TooltipContent>
                </UITooltip>

                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center cursor-help">
                      <span>Preço Atual:</span>
                      <span>${btcData.prices[btcData.prices.length - 1].price.toLocaleString()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>O preço atual do Bitcoin em dólares americanos (USD). Compare este valor com a 200MMA para entender a tendência.</p>
                  </TooltipContent>
                </UITooltip>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Mayer Multiple</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>O Multiplicador de Mayer é uma métrica que compara o preço atual com a média móvel de 200 dias. 
                    Ajuda a identificar períodos de sobrecompra e sobrevenda do Bitcoin.</p>
                  </TooltipContent>
                </UITooltip>
                <Badge 
                  className={getSignalColor(btcData.mayerMultiple, 2.4)}
                  role="status"
                  aria-label={`Status atual: ${btcData.mayerMultiple > 2.4 ? 'Venda' : btcData.mayerMultiple < 1.3 ? 'Compra' : 'Neutro'}`}
                >
                  {btcData.mayerMultiple > 2.4 ? 'Venda' : btcData.mayerMultiple < 1.3 ? 'Compra' : 'Neutro'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center cursor-help">
                      <span>Valor Atual:</span>
                      <span>{btcData.mayerMultiple.toFixed(2)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>O valor atual do Multiplicador de Mayer. Valores extremos podem indicar oportunidades de compra ou venda.</p>
                  </TooltipContent>
                </UITooltip>

                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center cursor-help">
                      <span>Referência Compra:</span>
                      <span>1.3</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quando o Multiplicador está abaixo de 1.3, historicamente tem sido um bom momento para comprar Bitcoin.</p>
                  </TooltipContent>
                </UITooltip>

                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center cursor-help">
                      <span>Referência Venda:</span>
                      <span>2.4</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quando o Multiplicador está acima de 2.4, historicamente tem sido um momento de cautela, indicando possível sobrevalorização.</p>
                  </TooltipContent>
                </UITooltip>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <UITooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">Gráfico de Preço e 200MMA</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Este gráfico mostra a evolução do preço do Bitcoin em comparação com sua média móvel de 200 dias, 
                  ajudando a visualizar tendências de longo prazo.</p>
                </TooltipContent>
              </UITooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]" role="img" aria-label="Gráfico de preço do Bitcoin e média móvel de 200 dias">
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
    </TooltipProvider>
  );
};

export default AnaliseTecnica;