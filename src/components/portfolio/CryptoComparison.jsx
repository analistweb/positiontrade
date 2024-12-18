import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const CryptoComparison = ({ cryptoData }) => {
  const calculateCorrelation = (crypto1, crypto2) => {
    // Simulação de correlação para demonstração
    return Math.random().toFixed(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            Comparação de Ativos
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Análise comparativa entre diferentes criptomoedas
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
                  <TableHead>Par</TableHead>
                  <TableHead>Correlação</TableHead>
                  <TableHead>Força Relativa</TableHead>
                  <TableHead>Tendência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cryptoData?.slice(0, 3).map((crypto1, index) => (
                  cryptoData?.slice(index + 1, 4).map((crypto2) => (
                    <TableRow key={`${crypto1.id}-${crypto2.id}`} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <img 
                              src={crypto1.image} 
                              alt={crypto1.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="ml-2">{crypto1.symbol.toUpperCase()}</span>
                          </div>
                          <span>/</span>
                          <div className="flex items-center">
                            <img 
                              src={crypto2.image} 
                              alt={crypto2.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="ml-2">{crypto2.symbol.toUpperCase()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {calculateCorrelation(crypto1, crypto2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {crypto1.price_change_percentage_24h > crypto2.price_change_percentage_24h ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {crypto1.symbol.toUpperCase()} mais forte
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" />
                            {crypto2.symbol.toUpperCase()} mais forte
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            (crypto1.price_change_percentage_24h + crypto2.price_change_percentage_24h) / 2 > 0 
                              ? "success" 
                              : "destructive"
                          }
                        >
                          {((crypto1.price_change_percentage_24h + crypto2.price_change_percentage_24h) / 2).toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CryptoComparison;