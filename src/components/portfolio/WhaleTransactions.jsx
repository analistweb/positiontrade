
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ArrowRightLeft, RefreshCw, Filter, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TransactionList from './whale-transactions/TransactionList';
import TransactionInsights from './whale-transactions/TransactionInsights';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { fetchWhaleTransactions, clearMarketCache, fetchOnChainData } from '@/services/marketService';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const WhaleTransactions = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [dataSource, setDataSource] = useState('exchange'); // 'exchange' ou 'onchain'
  
  const { 
    data: transactions, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['whaleTransactions', timeframe, dataSource],
    queryFn: () => dataSource === 'exchange' 
      ? fetchWhaleTransactions(timeframe)
      : fetchOnChainData(timeframe),
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    staleTime: 240000, // Considera dados obsoletos após 4 minutos
  });

  const handleRefresh = async () => {
    toast.info("Atualizando dados de grandes movimentações...");
    clearMarketCache(); // Limpar cache para forçar atualização
    await refetch();
    toast.success("Dados atualizados com sucesso!");
  };

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    toast.info(`Alterando período para: ${value}`);
  };

  const handleDataSourceChange = (value) => {
    setDataSource(value);
    toast.info(`Alterando fonte de dados para: ${value === 'exchange' ? 'Exchanges' : 'On-chain'}`);
  };

  // Adicionar informação de proxy quando houver erro de conexão
  useEffect(() => {
    if (error && error.message?.includes('Network Error')) {
      toast.error(
        "Erro de conexão ao obter dados. Usando cache local.", 
        { 
          description: "As APIs públicas podem ter limites de requisição.",
          duration: 5000
        }
      );
    }
  }, [error]);

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
                      Análise de movimentações significativas baseada em dados reais de volume de transações das principais exchanges e dados on-chain
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <Select value={timeframe} onValueChange={handleTimeframeChange}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">1 dia</SelectItem>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="14d">14 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center ml-2">
                <Select value={dataSource} onValueChange={handleDataSourceChange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Fonte de dados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exchange">Exchanges</SelectItem>
                    <SelectItem value="onchain">On-chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          </div>
        </CardHeader>
        <CardContent>
          {dataSource === 'onchain' && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Os dados on-chain são obtidos de fontes públicas e podem não representar todas as transações em tempo real.
              </AlertDescription>
            </Alert>
          )}
        
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
                dataSource={dataSource}
              />
            </TabsContent>

            <TabsContent value="insights">
              <TransactionInsights 
                transactions={transactions} 
                dataSource={dataSource}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WhaleTransactions;
