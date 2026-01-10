import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  Target, 
  Shield, 
  TrendingUp,
  TrendingDown,
  Activity,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingStrategy } from '@/hooks/useTradingStrategy';

const CryptoSignalCard = ({ symbol, onSignal }) => {
  const {
    marketData,
    isLoading,
    error,
    pairConfig,
    lastSignal,
    signalStatus,
    conditionsStatus,
    activeOperation,
    currentPrice,
    cancelOperation
  } = useTradingStrategy(symbol);

  // Ref para rastrear o último signalId já notificado e evitar loops infinitos
  const lastNotifiedSignalIdRef = useRef(null);

  // Callback quando há novo sinal - só dispara se o signalId for diferente do anterior
  useEffect(() => {
    if (lastSignal && onSignal && lastSignal.signalId) {
      // Só notifica se for um sinal realmente novo (signalId diferente)
      if (lastSignal.signalId !== lastNotifiedSignalIdRef.current) {
        lastNotifiedSignalIdRef.current = lastSignal.signalId;
        onSignal(lastSignal);
      }
    }
  }, [lastSignal?.signalId, onSignal]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-12 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-danger/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span style={{ color: pairConfig.color }}>{pairConfig.icon}</span>
            {pairConfig.shortName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-danger">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (signalStatus === 'buy') return 'border-buy/50 bg-buy/5';
    if (signalStatus === 'sell') return 'border-sell/50 bg-sell/5';
    return 'border-border';
  };

  const getStatusBadge = () => {
    if (signalStatus === 'buy') {
      return (
        <Badge className="bg-buy text-buy-foreground animate-pulse">
          <ArrowUpCircle className="w-3 h-3 mr-1" />
          COMPRA
        </Badge>
      );
    }
    if (signalStatus === 'sell') {
      return (
        <Badge className="bg-sell text-sell-foreground animate-pulse">
          <ArrowDownCircle className="w-3 h-3 mr-1" />
          VENDA
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Clock className="w-3 h-3 mr-1" />
        Aguardando
      </Badge>
    );
  };

  const priceChange = marketData && marketData.length >= 2 
    ? ((marketData[marketData.length - 1].close - marketData[0].close) / marketData[0].close * 100).toFixed(2)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`transition-all duration-300 ${getStatusColor()}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span 
                className="text-xl font-bold" 
                style={{ color: pairConfig.color }}
              >
                {pairConfig.icon}
              </span>
              <span>{pairConfig.shortName}</span>
              <span className="text-xs text-muted-foreground">/USDT</span>
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Preço Atual */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: pairConfig.decimals })}
              </p>
              <p className={`text-xs flex items-center gap-1 ${parseFloat(priceChange) >= 0 ? 'text-buy' : 'text-sell'}`}>
                {parseFloat(priceChange) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {priceChange}% (100 candles)
              </p>
            </div>
            
            {/* Força do Sinal */}
            {conditionsStatus?.marketStrength && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">
                        {conditionsStatus.marketStrength}
                      </div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Força do mercado (mínimo: 70)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Operação Ativa */}
          <AnimatePresence>
            {activeOperation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-elevated border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={activeOperation.type === 'COMPRA' ? 'default' : 'destructive'}>
                    {activeOperation.type} ATIVA
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={cancelOperation}
                    className="h-6 px-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entrada</p>
                    <p className="font-medium">${activeOperation.entryPrice.toFixed(pairConfig.decimals)}</p>
                  </div>
                  <div>
                    <p className="text-buy flex items-center gap-1">
                      <Target className="w-3 h-3" /> TP
                    </p>
                    <p className="font-medium text-buy">${activeOperation.takeProfit.toFixed(pairConfig.decimals)}</p>
                  </div>
                  <div>
                    <p className="text-sell flex items-center gap-1">
                      <Shield className="w-3 h-3" /> SL
                    </p>
                    <p className="font-medium text-sell">${activeOperation.stopLoss.toFixed(pairConfig.decimals)}</p>
                  </div>
                </div>
                
                {/* Barra de Progresso TP/SL */}
                <div className="mt-2">
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    {(() => {
                      const entry = activeOperation.entryPrice;
                      const tp = activeOperation.takeProfit;
                      const sl = activeOperation.stopLoss;
                      const current = currentPrice;
                      
                      const range = Math.abs(tp - sl);
                      const progress = activeOperation.type === 'COMPRA'
                        ? ((current - sl) / range) * 100
                        : ((sl - current) / range) * 100;
                      
                      return (
                        <motion.div
                          className={`absolute h-full ${progress > 50 ? 'bg-buy' : 'bg-sell'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      );
                    })()}
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-sell">SL</span>
                    <span className="text-muted-foreground">Entrada</span>
                    <span className="text-buy">TP</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Indicadores Rápidos */}
          {conditionsStatus && !activeOperation && (
            <div className="grid grid-cols-4 gap-1 text-xs">
              <div className={`p-1 rounded text-center ${conditionsStatus.dmi.adx > 25 ? 'bg-buy/10 text-buy' : 'bg-muted text-muted-foreground'}`}>
                ADX: {conditionsStatus.dmi.adx?.toFixed(0)}
              </div>
              <div className={`p-1 rounded text-center ${conditionsStatus.rsi.value > 50 ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                RSI: {conditionsStatus.rsi.value?.toFixed(0)}
              </div>
              <div className={`p-1 rounded text-center ${conditionsStatus.macd.histogram > 0 ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                MACD: {conditionsStatus.macd.histogram > 0 ? '+' : '-'}
              </div>
              <div className={`p-1 rounded text-center ${conditionsStatus.filters.volume ? 'bg-buy/10 text-buy' : 'bg-muted text-muted-foreground'}`}>
                Vol: {conditionsStatus.filters.volume ? '✓' : '✗'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CryptoSignalCard;
