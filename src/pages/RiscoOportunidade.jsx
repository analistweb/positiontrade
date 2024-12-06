import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { fetchWhaleTransactions } from '../services/cryptoService';
import { ArrowUpIcon, ArrowDownIcon, InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AnaliseSentimento from '../components/risco-oportunidade/AnaliseSentimento';
import AnaliseIndicadores from '../components/risco-oportunidade/AnaliseIndicadores';

const RiscoOportunidade = () => {
  const { data: whaleData, isLoading } = useQuery({
    queryKey: ['whaleTransactions'],
    queryFn: fetchWhaleTransactions,
    refetchInterval: 30000,
  });

  const getFlowDirection = (from, to) => {
    if (from.includes('exchange') && !to.includes('exchange')) {
      return {
        type: 'ACUMULAÇÃO',
        description: 'Saída de corretora para carteira pessoal',
        badge: 'success'
      };
    }
    if (!from.includes('exchange') && to.includes('exchange')) {
      return {
        type: 'DISTRIBUIÇÃO',
        description: 'Entrada em corretora vinda de carteira pessoal',
        badge: 'warning'
      };
    }
    return {
      type: 'NEUTRO',
      description: 'Movimentação entre carteiras do mesmo tipo',
      badge: 'secondary'
    };
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Análise de Risco e Oportunidade</h1>
      
      <div className="grid gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Movimentações de Grandes Carteiras
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Acompanhe o fluxo de Bitcoin entre corretoras e carteiras pessoais.
                        ACUMULAÇÃO indica saída de corretoras (bullish),
                        DISTRIBUIÇÃO indica entrada em corretoras (bearish).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Volume (BTC)</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Tipo de Fluxo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whaleData?.map((tx, index) => {
                      const flow = getFlowDirection(tx.from, tx.to);
                      return (
                        <TableRow key={index}>
                          <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{tx.amount.toFixed(2)} BTC</TableCell>
                          <TableCell>{tx.from}</TableCell>
                          <TableCell>{tx.to}</TableCell>
                          <TableCell>
                            <Badge variant={flow.badge} className="flex items-center gap-1">
                              {flow.type === 'ACUMULAÇÃO' && <ArrowUpIcon className="h-3 w-3" />}
                              {flow.type === 'DISTRIBUIÇÃO' && <ArrowDownIcon className="h-3 w-3" />}
                              {flow.type}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <InfoIcon className="h-3 w-3 ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{flow.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AnaliseSentimento />
        <AnaliseIndicadores />
      </div>
    </div>
  );
};

export default RiscoOportunidade;