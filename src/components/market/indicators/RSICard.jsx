import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const RSICard = ({ crypto, rsi }) => {
  return (
    <div className="flex justify-between items-center p-3 bg-white/80 dark:bg-black/20 rounded-lg hover:bg-white/90 dark:hover:bg-black/30 transition-colors">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {crypto}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>RSI (Índice de Força Relativa) - Valores:</p>
              <p>Acima de 70: Sobrecomprado</p>
              <p>Abaixo de 30: Sobrevendido</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Badge variant="secondary" className="font-mono">
        RSI: {rsi?.toFixed(2) || 'N/A'}
      </Badge>
    </div>
  );
};

export default RSICard;