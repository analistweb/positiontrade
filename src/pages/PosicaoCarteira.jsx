import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioData, fetchWhaleTransactions } from '../services/cryptoService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioOverview from '../components/portfolio/PortfolioOverview';
import WhaleTransactions from '../components/portfolio/WhaleTransactions';

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
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Carteira e Movimentações</h1>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (portfolioError || whaleError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar dados</AlertTitle>
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
      <h1 className="text-3xl font-bold mb-6">Carteira e Movimentações</h1>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <PortfolioOverview portfolioData={portfolioData} />
        <WhaleTransactions transactions={whaleData} />
      </div>
    </div>
  );
};

export default PosicaoCarteira;