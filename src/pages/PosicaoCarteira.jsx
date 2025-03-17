
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioData } from '../services/cryptoService';
import { fetchWhaleTransactions, clearMarketCache } from '../services/marketService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioOverview from '../components/portfolio/PortfolioOverview';
import WhaleTransactions from '../components/portfolio/WhaleTransactions';
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logError } from '../utils/logger';

const PosicaoCarteira = () => {
  const { 
    data: portfolioData, 
    isLoading: portfolioLoading, 
    error: portfolioError,
    refetch: refetchPortfolio 
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioData,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    staleTime: 240000, // Considera dados obsoletos após 4 minutos
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 60000), // Exponential backoff with max 1 minute
    onError: (error) => {
      logError(error, { context: 'Portfolio Data Fetch' });
      toast.error("Erro ao carregar portfólio", {
        description: "Verifique sua conexão e tente novamente",
      });
    }
  });

  const { 
    refetch: refetchWhale,
    error: whaleError 
  } = useQuery({
    queryKey: ['whaleTransactions'],
    queryFn: fetchWhaleTransactions,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    staleTime: 240000, // Considera dados obsoletos após 4 minutos
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 60000),
    onError: (error) => {
      logError(error, { context: 'Whale Transactions Fetch' });
      toast.error("Erro ao carregar transações", {
        description: "Verifique sua conexão e tente novamente",
      });
    }
  });

  const handleRefresh = async () => {
    toast.info("Atualizando dados...", {
      description: "Aguarde enquanto buscamos as informações mais recentes."
    });
    
    try {
      // Limpar cache para forçar atualização
      clearMarketCache();
      await Promise.all([refetchPortfolio(), refetchWhale()]);
      
      toast.success("Dados atualizados!", {
        description: "As informações foram atualizadas com sucesso."
      });
    } catch (error) {
      logError(error, { context: 'Manual Refresh' });
      toast.error("Erro ao atualizar", {
        description: "Não foi possível atualizar os dados. Verifique sua conexão e tente novamente.",
        duration: 5000
      });
    }
  };

  if (portfolioLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Carteira e Movimentações</h1>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Atualizando...
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[500px] w-full rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (portfolioError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados do seu portfólio.
            <br />
            Erro: {portfolioError?.message || "Erro de conexão"}
            <br />
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Carteira e Movimentações</h1>
        <Button 
          variant="outline"
          onClick={handleRefresh}
          className="hover:bg-primary/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar dados
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PortfolioOverview portfolioData={portfolioData} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <WhaleTransactions />
        </motion.div>
      </div>
      
      {whaleError && (
        <div className="mt-4">
          <Alert variant="warning">
            <AlertTitle>Nota sobre os dados de transações</AlertTitle>
            <AlertDescription>
              As APIs públicas de criptomoedas podem ter limites de requisição que afetam a disponibilidade dos dados.
              Se encontrar problemas, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </motion.div>
  );
};

export default PosicaoCarteira;
