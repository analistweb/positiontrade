import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import WhaleTransactions from '../components/portfolio/WhaleTransactions';
import PortfolioKPIs from '../components/portfolio/PortfolioKPIs';
import PortfolioDistribution from '../components/portfolio/PortfolioDistribution';
import EnhancedPortfolioTable from '../components/portfolio/EnhancedPortfolioTable';
import { usePortfolioManagement } from '../hooks/usePortfolioManagement';
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PosicaoCarteira = () => {
  const { 
    portfolio, 
    isLoading: portfolioLoading, 
    updateHolding,
    stats 
  } = usePortfolioManagement();

  const handleRefresh = () => {
    toast.success("Dados atualizados com sucesso!");
    // Em produção, aqui você faria fetch de APIs reais
  };

  if (portfolioLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Carteira Inteligente</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Gestão completa com análise de lucro e risco
            </p>
          </div>
          <Button variant="outline" disabled className="self-end sm:self-auto">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Carregando...
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[100px] sm:h-[120px] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Carteira Inteligente
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gestão completa com análise de lucro/prejuízo e distribuição de risco
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={handleRefresh}
          className="hover:bg-primary/10 self-end sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Atualizar dados</span>
          <span className="sm:hidden">Atualizar</span>
        </Button>
      </div>

      {/* KPIs Dashboard */}
      <PortfolioKPIs portfolioStats={stats} />

      {/* Distribuição e Tabela */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <PortfolioDistribution portfolioData={portfolio} />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <WhaleTransactions />
        </motion.div>
      </div>

      {/* Tabela Detalhada */}
      <EnhancedPortfolioTable 
        portfolioData={portfolio}
        onUpdateHolding={updateHolding}
      />
    </motion.div>
  );
};

export default PosicaoCarteira;
