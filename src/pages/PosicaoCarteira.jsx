import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioData, fetchWhaleTransactions } from '../services/cryptoService';
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon, ArrowRightFromLine, ArrowLeftFromLine } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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

  const getTransactionType = (from, to) => {
    if (from.includes('exchange') && !to.includes('exchange')) {
      return {
        type: 'ACUMULAÇÃO',
        description: 'Saída de corretora para carteira pessoal - Sinal geralmente positivo, indica acumulação',
        icon: <ArrowRightFromLine className="h-4 w-4 text-green-500" />,
        badgeColor: 'bg-green-100 text-green-800'
      };
    }
    if (!from.includes('exchange') && to.includes('exchange')) {
      return {
        type: 'DISTRIBUIÇÃO',
        description: 'Entrada em corretora vinda de carteira pessoal - Sinal geralmente negativo, indica possível venda',
        icon: <ArrowLeftFromLine className="h-4 w-4 text-red-500" />,
        badgeColor: 'bg-red-100 text-red-800'
      };
    }
    return {
      type: 'NEUTRO',
      description: 'Movimentação entre carteiras do mesmo tipo',
      icon: null,
      badgeColor: 'bg-gray-100 text-gray-800'
    };
  };

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
                <TooltipContent className="max-w-md p-4">
                  <p className="font-semibold mb-2">Interpretação dos Movimentos:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRightFromLine className="h-4 w-4 text-green-500" />
                      <span>ACUMULAÇÃO: Saída de corretora para carteira pessoal (geralmente positivo)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowLeftFromLine className="h-4 w-4 text-red-500" />
                      <span>DISTRIBUIÇÃO: Entrada em corretora vinda de carteira pessoal (geralmente negativo)</span>
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Volume (USD)</TableHead>
                <TableHead>Tipo de Movimento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {whaleData?.slice(0, 10).map((transaction, index) => {
                const transactionType = getTransactionType(transaction.from, transaction.to);
                return (
                  <TableRow key={index}>
                    <TableCell>{new Date(transaction.timestamp).toLocaleString()}</TableCell>
                    <TableCell>${transaction.volume.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transactionType.icon}
                        <Badge className={`${transactionType.badgeColor}`}>
                          {transactionType.type}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{transactionType.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.from}</TableCell>
                    <TableCell>{transaction.to}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criptomoeda</TableHead>
                <TableHead>Preço Atual (USD)</TableHead>
                <TableHead>Volume 24h</TableHead>
                <TableHead>Variação 24h</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioData?.map((coin) => (
                <TableRow key={coin.id}>
                  <TableCell className="font-medium">{coin.name}</TableCell>
                  <TableCell>${coin.current_price.toLocaleString()}</TableCell>
                  <TableCell>${coin.total_volume.toLocaleString()}</TableCell>
                  <TableCell className={coin.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}>
                    {coin.price_change_percentage_24h.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PosicaoCarteira;