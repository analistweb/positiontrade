import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon, ExternalLink, Wallet, Building, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from '@/lib/utils';  // Criar utilitários de formatação

const WhaleTransactions = ({ transactions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <TrendingUp className="h-6 w-6" />
            Movimentações de Grandes Carteiras
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Transações significativas acima de $500,000 em tempo real
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Horário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Destino</TableHead>
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
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WhaleTransactions;