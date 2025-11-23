import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const ConfirmationItem = ({ label, value, isActive }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      {isActive ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500/50" />
      )}
      {typeof value === 'number' && (
        <span className="text-sm font-medium">{value.toFixed(2)}</span>
      )}
    </div>
  </div>
);

const SignalStrengthIndicator = ({ conditionsStatus, signalStatus }) => {
  if (!conditionsStatus) return null;

  const getSignalStrength = () => {
    const strength = conditionsStatus.marketStrength || 50;
    if (strength >= 70) return { label: 'FORTE', color: 'bg-green-500', textColor: 'text-green-500' };
    if (strength >= 55) return { label: 'MODERADO', color: 'bg-blue-500', textColor: 'text-blue-500' };
    if (strength >= 45) return { label: 'NEUTRO', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (strength >= 30) return { label: 'FRACO', color: 'bg-orange-500', textColor: 'text-orange-500' };
    return { label: 'MUITO FRACO', color: 'bg-red-500', textColor: 'text-red-500' };
  };

  const strength = getSignalStrength();
  const isBuySignal = signalStatus === 'buy';
  const isSellSignal = signalStatus === 'sell';
  const isWaiting = signalStatus === 'wait';

  const activeConditions = isBuySignal ? conditionsStatus.buy : 
                          isSellSignal ? conditionsStatus.sell : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 ${
        isBuySignal ? 'border-green-500/50 bg-green-500/5' : 
        isSellSignal ? 'border-red-500/50 bg-red-500/5' : 
        'border-border/50'
      }`}>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              {isBuySignal && <TrendingUp className="w-5 h-5 text-green-500" />}
              {isSellSignal && <TrendingDown className="w-5 h-5 text-red-500" />}
              {isWaiting && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              Status do Sinal
            </CardTitle>
            <Badge 
              variant="outline" 
              className={`${strength.color} text-white border-none`}
            >
              {strength.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {/* Força do Mercado - Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Força do Mercado</span>
              <span className={`text-sm font-bold ${strength.textColor}`}>
                {conditionsStatus.marketStrength?.toFixed(0)}/100
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${conditionsStatus.marketStrength}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full ${strength.color}`}
              />
            </div>
          </div>

          {/* Tipo de Sinal Atual */}
          <div className="p-4 rounded-lg border border-border/50 bg-background/50">
            <div className="text-center">
              {isBuySignal && (
                <>
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="text-lg font-bold text-green-500">SINAL DE COMPRA</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Condições favoráveis para entrada long
                  </p>
                </>
              )}
              {isSellSignal && (
                <>
                  <TrendingDown className="w-12 h-12 mx-auto mb-2 text-red-500" />
                  <p className="text-lg font-bold text-red-500">SINAL DE VENDA</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Condições favoráveis para entrada short
                  </p>
                </>
              )}
              {isWaiting && (
                <>
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                  <p className="text-lg font-bold text-muted-foreground">AGUARDANDO</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monitorando condições de mercado...
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Confirmações Técnicas */}
          {activeConditions && (
            <div className="space-y-2">
              <p className="text-sm font-semibold mb-3">Confirmações Técnicas</p>
              <div className="space-y-1">
                <ConfirmationItem 
                  label="Rompimento" 
                  value={null}
                  isActive={activeConditions.breakout} 
                />
                <ConfirmationItem 
                  label="Didi Index" 
                  value={null}
                  isActive={activeConditions.didi} 
                />
                <ConfirmationItem 
                  label="DMI/ADX" 
                  value={conditionsStatus.adx}
                  isActive={activeConditions.dmi} 
                />
                <ConfirmationItem 
                  label="Tendência EMA50" 
                  value={null}
                  isActive={activeConditions.trend} 
                />
                <ConfirmationItem 
                  label="RSI" 
                  value={conditionsStatus.rsi}
                  isActive={activeConditions.rsi} 
                />
                <ConfirmationItem 
                  label="MACD" 
                  value={conditionsStatus.macdValue}
                  isActive={activeConditions.macd} 
                />
                <ConfirmationItem 
                  label="Volume" 
                  value={null}
                  isActive={activeConditions.volume} 
                />
                <ConfirmationItem 
                  label="OBV Tendência" 
                  value={null}
                  isActive={activeConditions.obv} 
                />
                <ConfirmationItem 
                  label="Força Breakout" 
                  value={activeConditions.breakoutStrength}
                  isActive={activeConditions.breakoutStrength >= 0.6} 
                />
                <ConfirmationItem 
                  label="R:R Válido" 
                  value={conditionsStatus.rrRatio}
                  isActive={activeConditions.rrValid} 
                />
              </div>
            </div>
          )}

          {/* Resumo de Confirmações */}
          {activeConditions && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confirmações Ativas</span>
                <span className="font-bold">
                  {Object.values(activeConditions).filter(v => v === true).length} / {Object.keys(activeConditions).length}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SignalStrengthIndicator;
