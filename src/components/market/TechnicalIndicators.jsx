
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TechnicalIndicators = ({ analise }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Indicadores Técnicos
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Indicadores técnicos são ferramentas estatísticas que ajudam a analisar o mercado</p>
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
                      <span>RSI Atual:</span>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4">
                      <p>O RSI (Índice de Força Relativa) mede a velocidade e magnitude das mudanças de preço:</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>RSI {'>'} 70: Mercado sobrecomprado</li>
                        <li>RSI {'<'} 30: Mercado sobrevendido</li>
                        <li>Entre 30-70: Zona neutra</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className={`font-mono ${
                  analise.rsi > 70 ? "text-red-500" : 
                  analise.rsi < 30 ? "text-green-500" : 
                  "text-yellow-500"
                }`}>
                  {analise.rsi?.toFixed(2) || 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-card/50 rounded-lg">
              <div className="flex justify-between items-start">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-2">
                      <span>Banda Superior:</span>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4">
                      <p>Bandas de Bollinger são indicadores de volatilidade:</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>Preço próximo à banda superior: Possível sobrevalorização</li>
                        <li>Preço entre as bandas: Volatilidade normal</li>
                        <li>Usado para identificar possíveis reversões</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-mono">${analise.bandaSuperior?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 bg-destructive/20 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-center font-medium text-destructive">
                  Confirmação de formação de topo detectada
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-destructive" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4">
                      <p>Uma formação de topo é identificada quando:</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>RSI mostra condições de sobrecompra</li>
                        <li>Preço atinge ou ultrapassa a Banda Superior</li>
                        <li>Volume de vendas aumenta significativamente</li>
                      </ul>
                      <p className="mt-2 text-destructive">Considere reduzir exposição ao risco</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TechnicalIndicators;

