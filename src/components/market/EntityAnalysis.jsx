
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, HelpCircle, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EntityAnalysis = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Análise de Entidades
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Análise do comportamento das grandes entidades (whales) do mercado</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-card/50 rounded-lg">
              <div className="flex justify-between items-start">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-2">
                      <span>Volume de Grandes Entidades:</span>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4">
                      <p>Volume movimentado por grandes players (whales):</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>Alto volume: Possível mudança de tendência</li>
                        <li>Volume crescente: Aumento de interesse institucional</li>
                        <li>Volume &gt; $20B: Atividade significativa</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-mono">
                  ${((data.total_volumes?.[data.total_volumes.length - 1]?.[1] || 0) / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>

            <div className="p-4 bg-card/50 rounded-lg">
              <div className="flex justify-between items-start">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-2">
                      <span>Variação 24h:</span>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4">
                      <p>Variação percentual nas últimas 24 horas:</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>Positiva: Movimento de alta no período</li>
                        <li>Negativa: Movimento de baixa no período</li>
                        <li>Alta volatilidade: Variação &gt; 5%</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                  {((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                    data.prices?.[data.prices.length - 24]?.[1] * 100) > 0 ? 
                    <TrendingUp className="h-4 w-4 text-green-500" /> :
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  }
                  <span className={`font-mono ${
                    ((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                    data.prices?.[data.prices.length - 24]?.[1] * 100) > 0 
                      ? "text-green-500" 
                      : "text-red-500"
                  }`}>
                    {((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                      data.prices?.[data.prices.length - 24]?.[1] * 100)?.toFixed(2) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EntityAnalysis;
