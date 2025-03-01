
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TransactionList from './whale-transactions/TransactionList';
import TransactionInsights from './whale-transactions/TransactionInsights';
import { useQuery } from '@tanstack/react-query';
import { fetchWhaleTransactions, clearMarketCache } from '@/services/marketService';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const WhaleTransactions = () => {
  const { 
    data: transactions, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['whaleTransactions'],
    queryFn: fetchWhaleTransactions,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    staleTime: 240000, // Considera dados obsoletos após 4 minutos
  });

  const handleRefresh = async () => {
    toast.info("Atualizando dados de grandes movimentações...");
    clearMarketCache(); // Limpar cache para forçar atualização
    await refetch();
    toast.success("Dados atualizados com sucesso!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <Toaster />
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-50/5 to-purple-50/5">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <ArrowRightLeft className="h-6 w-6" />
              Movimentações de Grandes Carteiras
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Análise simulada de movimentações significativas baseada em dados reais de volume de transações
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-primary/10"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <TransactionList 
                transactions={transactions} 
                isLoading={isLoading}
                error={error}
              />
            </TabsContent>

            <TabsContent value="insights">
              <TransactionInsights transactions={transactions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WhaleTransactions;
