
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon, ExternalLink, Wallet, Building, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WhaleTransactions = ({ transactions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-50/5 to-purple-50/5">
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
                    Análise de movimentações significativas baseada em dados de grandes players do mercado
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Horário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Smart Money Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((tx, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tx.type === "Compra" ? "success" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {tx.type === "Compra" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {tx.cryptoAmount} {tx.cryptoSymbol}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(tx.volume)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.destination === "Carteira" ? (
                              <>
                                <Wallet className="h-4 w-4 text-primary" />
                                <span>Carteira Privada</span>
                              </>
                            ) : (
                              <>
                                <Building className="h-4 w-4 text-primary" />
                                <span>{tx.exchange}</span>
                              </>
                            )}
                            {tx.destinationAddress && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <ExternalLink 
                                      className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" 
                                      onClick={() => window.open(`https://etherscan.io/address/${tx.destinationAddress}`, '_blank')}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs">
                                      {tx.destinationAddress}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`bg-primary/10 ${
                              tx.smartMoneyScore >= 80 ? 'text-green-500' : 
                              tx.smartMoneyScore >= 60 ? 'text-yellow-500' : 
                              'text-red-500'
                            }`}
                          >
                            {tx.smartMoneyScore}/100
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Análise de Comportamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transactions && (
                      <>
                        <div className="p-4 rounded-lg bg-primary/5">
                          <p className="text-sm font-medium">Tendência Dominante</p>
                          <p className="text-2xl font-bold text-primary">
                            {transactions.filter(tx => tx.type === "Compra").length > 
                             transactions.filter(tx => tx.type === "Venda").length 
                             ? "Acumulação" : "Distribuição"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Baseado nas últimas {transactions.length} transações
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-primary/5">
                          <p className="text-sm font-medium">Volume Médio</p>
                          <p className="text-2xl font-bold text-green-500">
                            {formatCurrency(
                              transactions.reduce((acc, tx) => acc + tx.volume, 0) / 
                              transactions.length
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Média por transação
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Principais Movimentações</h3>
                  <div className="space-y-2">
                    {transactions?.slice(0, 3).map((tx, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
                        <div>
                          <p className="font-medium">{tx.destination === "Carteira" ? "Carteira Privada" : tx.exchange}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(tx.volume)}
                          </p>
                        </div>
                        <Badge variant={tx.type === "Compra" ? "success" : "destructive"}>
                          {tx.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WhaleTransactions;
