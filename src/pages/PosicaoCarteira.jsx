import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioData, fetchWhaleTransactions } from '../services/cryptoService';
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon, ArrowRightLeft, WalletIcon, BuildingIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getTransactionType = (type, exchange) => {
  if (type === 'withdrawal' && exchange) {
    return {
      type: 'ACUMULAÇÃO',
      description: 'Saída da corretora para carteira pessoal',
      icon: <WalletIcon className="h-4 w-4" />,
      color: 'bg-green-500'
    };
  }
  if (type === 'deposit' && exchange) {
    return {
      type: 'DISTRIBUIÇÃO',
      description: 'Entrada na corretora vinda de carteira pessoal',
      icon: <BuildingIcon className="h-4 w-4" />,
      color: 'bg-yellow-500'
    };
  }
  return {
    type: 'TRANSFERÊNCIA',
    description: 'Movimentação entre carteiras',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: 'bg-blue-500'
  };
};

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Volume (USD)</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Fluxo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(whaleData || []).slice(0, 10).map((transaction, index) => {
                const transactionInfo = getTransactionType(transaction?.type, transaction?.exchange);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      {transaction?.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>${transaction?.volume?.toLocaleString() ?? 'N/A'}</TableCell>
                    <TableCell>{transaction?.type ?? 'N/A'}</TableCell>
                    <TableCell>{transaction?.exchange ?? 'N/A'}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className={`${transactionInfo.color} text-white flex items-center gap-1`}>
                              {transactionInfo.icon}
                              {transactionInfo.type}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{transactionInfo.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
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
              {(portfolioData || []).map((coin, index) => (
                <TableRow key={coin?.id ?? index}>
                  <TableCell className="font-medium">{coin?.name ?? 'N/A'}</TableCell>
                  <TableCell>${coin?.current_price?.toLocaleString() ?? 'N/A'}</TableCell>
                  <TableCell>${coin?.total_volume?.toLocaleString() ?? 'N/A'}</TableCell>
                  <TableCell className={coin?.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}>
                    {coin?.price_change_percentage_24h?.toFixed(2) ?? 'N/A'}%
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