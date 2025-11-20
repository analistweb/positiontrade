import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { axiosInstance } from '@/config/api';
import { retryWithBackoff } from '@/services/errorHandlingService';
import { motion } from "framer-motion";
import { LoadingCard } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import PriceComparisonChart from '../components/technical/PriceComparisonChart';
import TechnicalGaugeGrid from '../components/market/TechnicalGaugeGrid';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AnaliseTecnica = () => {
  const { data: btcData, isLoading, error, refetch } = useQuery({
    queryKey: ['btcTechnicalAnalysis'],
    queryFn: async () => {
      return await retryWithBackoff(async () => {
        const response = await axiosInstance.get('/coins/bitcoin/market_chart', {
          params: {
            vs_currency: 'usd',
            days: 90, // Reduced from 365 to avoid API limits
            interval: 'daily'
          }
        });

        if (!response.data || !response.data.prices) {
          console.error('Invalid response data:', response.data);
          throw new Error('Dados inválidos recebidos da API');
        }

        const prices = response.data.prices.map(price => ({
          date: new Date(price[0]).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          price: price[1]
        }));

        // Calculate 200 MMA (or use available data if less than 200 days)
        const mmaLength = Math.min(200, prices.length);
        const mma200 = prices.slice(-mmaLength).reduce((sum, p) => sum + p.price, 0) / mmaLength;
        const mayerMultiple = prices[prices.length - 1].price / mma200;

        return {
          prices,
          mma200,
          mayerMultiple
        };
      }, 'Análise Técnica Bitcoin');
    },
    refetchInterval: 300000,
    retry: 2,
    staleTime: 60000 // Consider data fresh for 1 minute
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4" role="status" aria-label="Carregando dados do Bitcoin">
        <LoadingCard title="Carregando análise técnica..." />
      </div>
    );
  }

  if (error || !btcData || !btcData.prices) {
    return (
      <div className="container mx-auto p-4" role="alert">
        <ErrorDisplay
          title="Erro ao carregar análise técnica"
          message="Não foi possível conectar com o provedor de dados. Verifique sua conexão ou tente novamente em alguns minutos."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const getSignalColor = (value, threshold) => {
    return value < threshold ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-6" role="heading" aria-level="1">Análise Técnica Bitcoin</h1>
          <DataSourceBadge isRealData={true} size="md" />
        </div>

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
                  className={getSignalColor(btcData.prices[btcData.prices.length - 1].price, btcData.mma200)}
                  role="status"
                  aria-label={`Sinal atual: ${btcData.prices[btcData.prices.length - 1].price > btcData.mma200 ? 'Alta' : 'Baixa'}`}
                >
                  {btcData.prices[btcData.prices.length - 1].price > btcData.mma200 ? 'Alta' : 'Baixa'}
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
                  className={btcData.mayerMultiple >= 2.4 ? 'bg-red-500' : btcData.mayerMultiple <= 1.3 ? 'bg-green-500' : 'bg-yellow-500'}
                  role="status"
                  aria-label={`Status atual: ${btcData.mayerMultiple >= 2.4 ? 'Venda' : btcData.mayerMultiple <= 1.3 ? 'Compra' : 'Neutro'}`}
                >
                  {btcData.mayerMultiple >= 2.4 ? 'Venda' : btcData.mayerMultiple <= 1.3 ? 'Compra' : 'Neutro'}
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

        <PriceComparisonChart 
          data={btcData} 
          mma200={btcData.mma200}
          currentPrice={btcData.prices[btcData.prices.length - 1].price}
        />
        
        <TechnicalGaugeGrid 
          rsi={50}
          mma200Ratio={btcData.prices[btcData.prices.length - 1].price / btcData.mma200}
          volumeChange={15}
        />
      </div>
  );
};

export default AnaliseTecnica;