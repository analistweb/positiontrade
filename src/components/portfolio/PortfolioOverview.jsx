import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import CryptoImage from '../common/CryptoImage';

const PortfolioOverview = ({ portfolioData }) => {
  const totalValue = portfolioData?.reduce((acc, coin) => 
    acc + (coin.quantity * coin.current_price), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Seu Portfólio</span>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Visão geral das suas criptomoedas e seu desempenho atual
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-xl">
              Total: ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criptomoeda</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço (USD)</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Variação 24h</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData?.map((coin) => (
                  <TableRow key={coin.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CryptoImage 
                          src={coin.image} 
                          alt={coin.name}
                          symbol={coin.symbol}
                          className="w-6 h-6"
                        />
                        <span>{coin.name}</span>
                        <span className="text-muted-foreground">({coin.symbol.toUpperCase()})</span>
                      </div>
                    </TableCell>
                    <TableCell>{coin.quantity}</TableCell>
                    <TableCell>${coin.current_price.toLocaleString()}</TableCell>
                    <TableCell>
                      ${(coin.quantity * coin.current_price).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={coin.price_change_percentage_24h > 0 ? "success" : "destructive"}
                        className="font-semibold"
                      >
                        {coin.price_change_percentage_24h.toFixed(2)}%
                      </Badge>
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

export default PortfolioOverview;