
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioData, fetchWhaleTransactions } from '../services/cryptoService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioOverview from '../components/portfolio/PortfolioOverview';
import WhaleTransactions from '../components/portfolio/WhaleTransactions';
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const PosicaoCarteira = () => {
  const { toast } = useToast();

  const { 
    data: portfolioData, 
    isLoading: portfolioLoading, 
    error: portfolioError,
    refetch: refetchPortfolio 
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioData,
    refetchInterval: 30000,
    onError: (error) => {
      toast({
        title: "Erro ao carregar portfólio",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const { 
    data: whaleData, 
    isLoading: whaleLoading, 
    error: whaleError,
    refetch: refetchWhale 
  } = useQuery({
    queryKey: ['whaleTransactions'],
    queryFn: fetchWhaleTransactions,
    refetchInterval: 30000,
    onError: (error) => {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleRefresh = async () => {
    toast({
      title: "Atualizando dados...",
      description: "Aguarde enquanto buscamos as informações mais recentes."
    });
    
    try {
      await Promise.all([refetchPortfolio(), refetchWhale()]);
      toast({
        title: "Dados atualizados!",
        description: "As informações foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (portfolioLoading || whaleLoading) {
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

  if (portfolioError || whaleError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {portfolioError?.message || whaleError?.message}
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
          <WhaleTransactions transactions={whaleData} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PosicaoCarteira;
