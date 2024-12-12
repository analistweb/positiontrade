import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const PortfolioOverview = ({ portfolioData }) => {
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
            Seu Portfólio
            <TooltipProvider>
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
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criptomoeda</TableHead>
                  <TableHead>Preço (USD)</TableHead>
                  <TableHead className="hidden md:table-cell">Volume 24h</TableHead>
                  <TableHead>Variação 24h</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData?.map((coin) => (
                  <TableRow key={coin.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <img 
                          src={coin.image} 
                          alt={coin.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{coin.name}</span>
                        <span className="text-muted-foreground">({coin.symbol.toUpperCase()})</span>
                      </div>
                    </TableCell>
                    <TableCell>${coin.current_price.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${coin.total_volume.toLocaleString()}
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