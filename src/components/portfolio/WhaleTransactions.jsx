import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon, ExternalLink, Wallet, Building } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const WhaleTransactions = ({ transactions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            Movimentações de Grandes Carteiras
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Acompanhe as movimentações significativas de grandes investidores em tempo real
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
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="hidden md:table-cell">Destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx, index) => (
                  <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={tx.type === "Compra" ? "success" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {tx.cryptoAmount.toLocaleString()} {tx.cryptoSymbol}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          (${tx.volume.toLocaleString()})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {tx.destination === "Wallet" ? (
                          <>
                            <Wallet className="h-4 w-4" />
                            <span>Carteira Privada</span>
                          </>
                        ) : (
                          <>
                            <Building className="h-4 w-4" />
                            <span>{tx.exchange}</span>
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
                  </TableRow>
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