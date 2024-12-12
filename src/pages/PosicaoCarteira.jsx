import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioData, fetchWhaleTransactions } from '../services/cryptoService';
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon, ExternalLink, Wallet, Building } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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
        <h1 className="text-3xl font-bold mb-6">Carteira e Movimentações</h1>
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
        Carteira e Movimentações
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-5 w-5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Acompanhe sua carteira e monitore as movimentações significativas do mercado,
                atualizadas a cada 30 segundos.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sua Carteira
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Visão geral das suas criptomoedas e seu desempenho
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
                      <TableCell 
                        className={coin.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}
                        role="status"
                        aria-label={`Variação de ${coin.price_change_percentage_24h.toFixed(2)}% nas últimas 24 horas`}
                      >
                        {coin.price_change_percentage_24h.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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
                    <TooltipContent>
                      <p className="max-w-xs">
                        Acompanhe as movimentações significativas de grandes investidores
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Destino</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whaleData?.slice(0, 10).map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(transaction.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === "Compra" ? "success" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {transaction.type}
                          <span className="sr-only">
                            {transaction.type === "Compra" ? "Compra realizada" : "Venda realizada"}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {transaction.cryptoAmount} {transaction.cryptoSymbol}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            (${transaction.volume.toLocaleString()})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.destination === "Wallet" ? (
                            <>
                              <Wallet className="h-4 w-4" />
                              <span>Carteira Privada</span>
                            </>
                          ) : (
                            <>
                              <Building className="h-4 w-4" />
                              <span>{transaction.exchange}</span>
                            </>
                          )}
                          {transaction.destinationAddress && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-xs">
                                    {transaction.destinationAddress}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PosicaoCarteira;