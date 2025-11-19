
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TechnicalIndicators = ({ analise, precoAtual }) => {
  // Detectar formação de topo real baseado em condições técnicas
  const isRSIOverBought = analise.rsi > 70;
  const isPriceNearUpperBand = precoAtual >= (analise.bandaSuperior * 0.98);
  const isTopFormationDetected = isRSIOverBought && isPriceNearUpperBand;

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
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Indicadores técnicos são ferramentas estatísticas que ajudam a analisar o mercado</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-card/50 rounded-lg">
              <div className="flex justify-between items-start">
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
                <span className="font-mono">${analise.bandaSuperior?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>

            {isTopFormationDetected && (
              <div className="p-4 bg-destructive/20 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-center font-medium text-destructive">
                  Confirmação de formação de topo detectada
                </p>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm p-4">
                    <p>Uma formação de topo é identificada quando:</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>RSI {'>'} 70 (sobrecompra) ✓</li>
                      <li>Preço próximo/acima da Banda Superior ✓</li>
                      <li>Risco elevado de reversão de tendência</li>
                    </ul>
                    <p className="mt-2 text-destructive font-semibold">Considere reduzir exposição ao risco</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              </div>
            )}

            {!isTopFormationDetected && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <p className="text-center text-sm text-muted-foreground">
                    Nenhuma formação de topo detectada no momento
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TechnicalIndicators;

