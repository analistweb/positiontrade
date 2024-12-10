import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { calculateEMA, getWeeklyData } from '../../services/marketService';
import { Bitcoin } from 'lucide-react';

const EMAAnalysis = ({ marketData, coin }) => {
  if (!marketData?.prices || marketData.prices.length < 56) {
    return null;
  }

  const prices = marketData.prices;
  const dailyPrices = prices.map(price => price[1]);
  const currentPrice = dailyPrices[dailyPrices.length - 1];
  
  // Calculate EMA using 56 days (8 weeks)
  const currentEMA = calculateEMA(dailyPrices.slice(-56));
  
  // Get weekly data for analysis
  const weeklyData = getWeeklyData(prices);
  const currentWeek = weeklyData[weeklyData.length - 1];
  const previousWeek = weeklyData[weeklyData.length - 2];
  
  // Check buy conditions
  const isAboveEMA = currentPrice > currentEMA;
  const brokeLastWeekHigh = previousWeek && currentWeek.high > previousWeek.high;
  const isWeeklyClose = (new Date().getDay() === 0); // Check if it's Sunday
  
  const isBuySignal = isAboveEMA && brokeLastWeekHigh && isWeeklyClose;

  const handleAlertClick = () => {
    toast.success(`Alerta configurado para ${coin}`, {
      description: "Você receberá notificações quando houver oportunidades de compra baseadas na análise semanal."
    });
  };

  // Format coin name to be more readable
  const formatCoinName = (coinId) => {
    return coinId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            <span>Análise EMA (8 semanas) - {formatCoinName(coin)}</span>
          </div>
          {isBuySignal && (
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
            <span>${currentEMA?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Máxima Semanal Anterior:</span>
            <span>${previousWeek?.high.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Máxima Semanal Atual:</span>
            <span>${currentWeek?.high.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isBuySignal ? "text-green-500" : "text-yellow-500"}>
              {isBuySignal 
                ? "Sinal de Compra Confirmado" 
                : isAboveEMA 
                  ? "Aguardando Confirmação Semanal"
                  : "Aguardando Condições"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EMAAnalysis;