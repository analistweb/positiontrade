import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles
} from "lucide-react";

const ConditionRow = ({ label, met, value, description }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30"
  >
    <div className="flex items-center gap-3">
      {met === true && <CheckCircle2 className="w-5 h-5 text-buy" />}
      {met === false && <XCircle className="w-5 h-5 text-sell" />}
      {met === null && <AlertCircle className="w-5 h-5 text-muted-foreground" />}
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
    {value !== undefined && (
      <Badge variant="outline" className={met ? 'border-buy/30 text-buy' : 'border-sell/30 text-sell'}>
        {value}
      </Badge>
    )}
  </motion.div>
);

const ActionableInsights = ({ rsi, emaData, volumeData, marketData }) => {
  // Calculate conditions
  const isRSIOversold = rsi <= 30;
  const isRSIOverbought = rsi >= 70;
  const isRSINeutral = rsi > 30 && rsi < 70;
  
  // Calculate price vs EMA condition
  const currentPrice = marketData?.prices?.[marketData.prices.length - 1]?.[1];
  const priceAboveEMA = emaData?.currentEMA && currentPrice > emaData.currentEMA;
  
  // Volume condition (simplified - assume positive if volume data exists)
  const volumeAboveAverage = volumeData?.isAboveAverage ?? null;
  
  // Overall signal strength
  const conditionsMet = [
    isRSIOversold || isRSIOverbought,
    priceAboveEMA !== undefined ? priceAboveEMA : null,
    volumeAboveAverage
  ].filter(c => c === true).length;

  const totalConditions = 3;
  const signalStrength = (conditionsMet / totalConditions) * 100;

  const getSignalType = () => {
    if (isRSIOversold && conditionsMet >= 2) {
      return { type: 'buy', label: 'Sinal de Compra', color: 'text-buy', bgColor: 'bg-buy/10', borderColor: 'border-buy/30' };
    }
    if (isRSIOverbought && conditionsMet >= 2) {
      return { type: 'sell', label: 'Sinal de Venda', color: 'text-sell', bgColor: 'bg-sell/10', borderColor: 'border-sell/30' };
    }
    return { type: 'neutral', label: 'Aguardando Confirmação', color: 'text-muted-foreground', bgColor: 'bg-muted/10', borderColor: 'border-border/50' };
  };

  const signal = getSignalType();

  const buyConditions = [
    {
      label: "RSI Sobrevendido",
      met: isRSIOversold,
      value: `RSI: ${rsi?.toFixed(0) || '--'}`,
      description: isRSIOversold ? "Ativo muito vendido - oportunidade" : "RSI acima de 30 - aguardar"
    },
    {
      label: "Preço acima da EMA",
      met: priceAboveEMA,
      value: priceAboveEMA ? "Confirmado" : "Não confirmado",
      description: "Tendência de alta confirmada pela média móvel"
    },
    {
      label: "Volume acima da média",
      met: volumeAboveAverage,
      value: volumeAboveAverage ? "Alto" : volumeAboveAverage === false ? "Baixo" : "N/A",
      description: "Volume forte confirma movimento de preço"
    }
  ];

  const sellConditions = [
    {
      label: "RSI Sobrecomprado",
      met: isRSIOverbought,
      value: `RSI: ${rsi?.toFixed(0) || '--'}`,
      description: isRSIOverbought ? "Ativo muito comprado - considere vender" : "RSI abaixo de 70 - aguardar"
    },
    {
      label: "Preço abaixo da EMA",
      met: priceAboveEMA === false,
      value: priceAboveEMA === false ? "Confirmado" : "Não confirmado",
      description: "Tendência de baixa confirmada pela média móvel"
    },
    {
      label: "Volume decrescente",
      met: volumeAboveAverage === false,
      value: volumeAboveAverage === false ? "Baixo" : volumeAboveAverage ? "Alto" : "N/A",
      description: "Volume fraco pode indicar exaustão do movimento"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Análise Acionável
            </CardTitle>
            <Badge className={`${signal.bgColor} ${signal.color} ${signal.borderColor}`}>
              {signal.type === 'buy' && <TrendingUp className="w-3 h-3 mr-1" />}
              {signal.type === 'sell' && <TrendingDown className="w-3 h-3 mr-1" />}
              {signal.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Signal Strength */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Força do Sinal</span>
              <span className="text-sm text-muted-foreground">{conditionsMet}/{totalConditions} condições</span>
            </div>
            <Progress value={signalStrength} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {signalStrength >= 66 ? 'Sinal forte - alta probabilidade' : 
               signalStrength >= 33 ? 'Sinal moderado - confirme com outros indicadores' : 
               'Sinal fraco - aguarde mais confirmações'}
            </p>
          </div>

          {/* Buy/Sell Conditions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Buy Conditions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-buy" />
                <h4 className="font-semibold text-buy">Condições de Compra</h4>
              </div>
              {buyConditions.map((condition, index) => (
                <ConditionRow key={index} {...condition} />
              ))}
            </div>

            {/* Sell Conditions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-sell" />
                <h4 className="font-semibold text-sell">Condições de Venda</h4>
              </div>
              {sellConditions.map((condition, index) => (
                <ConditionRow key={index} {...condition} />
              ))}
            </div>
          </div>

          {/* Action Recommendation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`p-4 rounded-xl ${signal.bgColor} border ${signal.borderColor}`}
          >
            <div className="flex items-center gap-3">
              <ArrowRight className={`w-5 h-5 ${signal.color}`} />
              <div>
                <p className={`font-semibold ${signal.color}`}>
                  {signal.type === 'buy' && 'Considere adicionar à posição com DCA'}
                  {signal.type === 'sell' && 'Considere realizar lucros parciais'}
                  {signal.type === 'neutral' && 'Mantenha posição atual e monitore'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {signal.type === 'buy' && 'RSI sobrevendido indica momento favorável para compras graduais.'}
                  {signal.type === 'sell' && 'RSI sobrecomprado sugere realização parcial de lucros.'}
                  {signal.type === 'neutral' && 'Nenhum sinal claro no momento. Aguarde confirmações.'}
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActionableInsights;
