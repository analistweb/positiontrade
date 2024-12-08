import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioData, fetchWhaleTransactions } from '../services/cryptoService';
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import WhaleTransactionsTable from '../components/carteira/WhaleTransactionsTable';
import MarketAnalysisTable from '../components/carteira/MarketAnalysisTable';

const PosicaoCarteira = () => {
  const { data: portfolioData, isLoading: portfolioLoading, error: portfolioError } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioData,
    refetchInterval: 30000,
  });

  const { data: whaleData, isLoading: whaleLoading, error: whaleError } = useQuery({
    queryKey: ['whaleTransactions'],
    queryFn: fetchWhaleTransactions,
    refetchInterval: 30000,
  });

  if (portfolioLoading || whaleLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Posição da Carteira</h1>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (portfolioError || whaleError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {portfolioError?.message || whaleError?.message}
            <br />
            Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        Posição da Carteira
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-5 w-5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Esta página mostra dados reais do mercado de criptomoedas, atualizados a cada 30 segundos.
                Os dados são obtidos diretamente da API do CoinGecko.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Movimentações de Grandes Carteiras
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Dados reais de transações de alto valor (whales) nas últimas 24 horas.
                    Atualizado em tempo real.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WhaleTransactionsTable transactions={whaleData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Análise de Mercado
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Dados em tempo real do mercado de criptomoedas,
                    incluindo preços, volumes e variações percentuais.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarketAnalysisTable data={portfolioData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PosicaoCarteira;