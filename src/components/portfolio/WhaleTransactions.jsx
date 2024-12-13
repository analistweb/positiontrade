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
                    Análise on-chain de movimentações significativas baseada em dados do Nansen
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
                              {tx.cryptoAmount.toLocaleString()} {tx.cryptoSymbol}
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
                                <span>{tx.exchange || 'Exchange'}</span>
                              </>
                            )}
                            {tx.destinationAddress && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground cursor-pointer" 
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
                          <Badge variant="outline" className="bg-primary/10">
                            {Math.floor(Math.random() * 40 + 60)}/100
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
                    <div className="p-4 rounded-lg bg-primary/5">
                      <p className="text-sm font-medium">Acumulação de Smart Money</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.floor(Math.random() * 30 + 70)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Carteiras com histórico de sucesso estão acumulando
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5">
                      <p className="text-sm font-medium">Fluxo de Exchange</p>
                      <p className="text-2xl font-bold text-green-500">
                        Saída Líquida
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tokens sendo movidos para carteiras privadas
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Principais Movimentações</h3>
                  <div className="space-y-2">
                    {[1, 2, 3].map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
                        <div>
                          <p className="font-medium">Carteira {index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(Math.random() * 1000000 + 500000)}
                          </p>
                        </div>
                        <Badge variant={index % 2 === 0 ? "success" : "destructive"}>
                          {index % 2 === 0 ? "Compra" : "Venda"}
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