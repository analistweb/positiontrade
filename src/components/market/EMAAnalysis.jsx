import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const EMAAnalysis = ({ marketData, coin }) => {
  if (!marketData?.prices || marketData.prices.length < 56) {
    return null;
  }

  const prices = marketData.prices.map(price => price[1]);
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  
  const currentEMA = calculateEMA(prices.slice(-56));
  const previousEMA = calculateEMA(prices.slice(-57, -1));

  const isPivotHigh = currentPrice > currentEMA && 
                      previousPrice < previousEMA && 
                      currentPrice > previousPrice;

  const handleAlertClick = () => {
    toast.success(`Alerta configurado para ${coin}`, {
      description: "Você receberá notificações quando houver oportunidades de compra."
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Análise EMA (8 semanas)
          {isPivotHigh && (
            <Badge 
              variant="success" 
              className="cursor-pointer"
              onClick={handleAlertClick}
            >
              Oportunidade de Compra
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Preço Atual:</span>
            <span>${currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>EMA (8 semanas):</span>
            <span>${currentEMA.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isPivotHigh ? "text-green-500" : "text-yellow-500"}>
              {isPivotHigh ? "Pivô de Alta" : "Aguardando Sinal"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EMAAnalysis;