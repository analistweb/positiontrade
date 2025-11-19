import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, RefreshCw, Sparkles, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { fetchETHUSDTData } from '@/services/binanceService';
import { useBinanceKlineStream } from '@/services/binanceSocket';
import { 
  calculateDidiIndex, 
  calculateDMI, 
  calculateEMA, 
  calculateATR,
  findPivotHigh,
  findPivotLow,
  calculateFibonacciLevels,
  getAdaptiveFibonacciTargets,
  calculateTPSL,
  validateRiskReward
} from '@/utils/technicalIndicators';
import StrategyMetrics from '@/components/strategy/StrategyMetrics';
import TechnicalGauges from '@/components/strategy/TechnicalGauges';
import CandlestickChart from '@/components/strategy/CandlestickChart';
import SignalTimeline from '@/components/strategy/SignalTimeline';

const EstrategiaETH = () => {
  const [lastSignal, setLastSignal] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);
  const [successfulSignals, setSuccessfulSignals] = useState([]);
  const [conditionsStatus, setConditionsStatus] = useState(null);
  const [activeOperation, setActiveOperation] = useState(null);
  const [fibonacciLevels, setFibonacciLevels] = useState(null);
  const [signalStatus, setSignalStatus] = useState('wait'); // 'buy', 'sell', 'wait'
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  
  const audioRef = useRef({
    buy: typeof Audio !== 'undefined' ? new Audio('/sounds/buy.mp3') : null,
    sell: typeof Audio !== 'undefined' ? new Audio('/sounds/sell.mp3') : null
  });

  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['ethusdt-15m'],
    queryFn: () => fetchETHUSDTData('15m', 100),
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    staleTime: 4000,
  });

  // WebSocket para updates em tempo real
  const handleNewKline = (klineData) => {
    console.log('[EstrategiaETH] Novo candle fechado via WebSocket:', klineData);
    // Refetch data quando novo candle fecha
    refetch();
  };

  const { connect, disconnect, isConnected } = useBinanceKlineStream('ethusdt', '15m', handleNewKline);

  useEffect(() => {
    // Conectar WebSocket
    connect();
    setIsWebSocketConnected(true);

    return () => {
      disconnect();
      setIsWebSocketConnected(false);
    };
  }, []);

  useEffect(() => {
    if (marketData && marketData.length > 0) {
      analyzeStrategy(marketData);
      checkSuccessfulSignals(marketData);
    }
  }, [marketData]);

  const checkSuccessfulSignals = (data) => {
    if (!data || data.length === 0) return;

    const currentPrice = data[data.length - 1].close;
    
    // Verificar operação ativa
    if (activeOperation) {
      let hitTP = false;
      let hitSL = false;
      
      if (activeOperation.type === 'COMPRA') {
        hitTP = currentPrice >= activeOperation.takeProfit;
        hitSL = currentPrice <= activeOperation.stopLoss;
      } else {
        hitTP = currentPrice <= activeOperation.takeProfit;
        hitSL = currentPrice >= activeOperation.stopLoss;
      }

      if (hitTP) {
        const profitPercent = activeOperation.type === 'COMPRA' 
          ? ((activeOperation.takeProfit - activeOperation.entryPrice) / activeOperation.entryPrice * 100).toFixed(2)
          : ((activeOperation.entryPrice - activeOperation.takeProfit) / activeOperation.entryPrice * 100).toFixed(2);

        const successSignal = {
          ...activeOperation,
          closedAt: new Date().toLocaleString('pt-BR'),
          profit: profitPercent,
          status: 'SUCESSO'
        };

        setSuccessfulSignals(prev => [successSignal, ...prev].slice(0, 20));
        setActiveOperation(null); // Libera para nova entrada
        toast.success(`✅ Take Profit atingido! Lucro: +${profitPercent}%`);
      } else if (hitSL) {
        const lossPercent = activeOperation.type === 'COMPRA' 
          ? ((activeOperation.stopLoss - activeOperation.entryPrice) / activeOperation.entryPrice * 100).toFixed(2)
          : ((activeOperation.entryPrice - activeOperation.stopLoss) / activeOperation.entryPrice * 100).toFixed(2);

        const lossSignal = {
          ...activeOperation,
          closedAt: new Date().toLocaleString('pt-BR'),
          profit: lossPercent,
          status: 'STOP LOSS'
        };

        setSuccessfulSignals(prev => [lossSignal, ...prev].slice(0, 20));
        setActiveOperation(null); // Libera para nova entrada
        toast.error(`🛑 Stop Loss atingido. Perda: ${lossPercent}%`);
      }
    }
  };

  // Função auxiliar para tocar som de alerta
  const playSignalSound = (signalType) => {
    try {
      if (audioRef.current[signalType]) {
        audioRef.current[signalType].play().catch(err => {
          console.log('Erro ao tocar som (pode ser bloqueado pelo navegador):', err);
        });
      }
    } catch (error) {
      console.log('Audio não suportado:', error);
    }
  };

  const analyzeStrategy = (data) => {
    if (!data || data.length < 100) return;

    // Se há operação ativa, não gera novos sinais
    if (activeOperation) {
      return;
    }

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const opens = data.map(d => d.open);
    const volumes = data.map(d => d.volume);

    // 1. Detectar pivôs (máximas e mínimas significativas)
    const pivotHighs = findPivotHigh(highs, 5, 2);
    const pivotLows = findPivotLow(lows, 5, 2);

    // 2. Identificar o candle de referência (menor corpo real entre as últimas 5 velas)
    const last5Candles = data.slice(-6, -1);
    let smallestCandleIndex = 0;
    let smallestBody = Infinity;

    last5Candles.forEach((candle, idx) => {
      const body = Math.abs(candle.close - candle.open);
      if (body < smallestBody) {
        smallestBody = body;
        smallestCandleIndex = idx;
      }
    });

    const referenceCandle = last5Candles[smallestCandleIndex];
    const triggerCandle = data[data.length - 1];

    // 3. Calcular indicadores
    const didiIndex = calculateDidiIndex(closes);
    const dmi = calculateDMI(highs, lows, closes);
    const atr = calculateATR(highs, lows, closes, 14);
    const ema50 = calculateEMA(closes, 50);

    // 4. Verificar rompimento
    const breakoutThreshold = 0.0005; // 0.05%
    const buyBreakout = triggerCandle.close > referenceCandle.high * (1 + breakoutThreshold);
    const sellBreakout = triggerCandle.close < referenceCandle.low * (1 - breakoutThreshold);

    // 5. Validar Didi Index (agulhada)
    const didiConfirmBuy = didiIndex.short[didiIndex.short.length - 1] > didiIndex.medium[didiIndex.medium.length - 1] &&
                           didiIndex.short[didiIndex.short.length - 1] > didiIndex.long[didiIndex.long.length - 1];
    
    const didiConfirmSell = didiIndex.short[didiIndex.short.length - 1] < didiIndex.medium[didiIndex.medium.length - 1] &&
                            didiIndex.short[didiIndex.short.length - 1] < didiIndex.long[didiIndex.long.length - 1];

    // 6. Validar DMI
    const currentDMI = dmi[dmi.length - 1];
    const prevDMI = dmi[dmi.length - 2];
    const dmiConfirmBuy = currentDMI.plusDI > currentDMI.minusDI && 
                          currentDMI.adx > 25 && 
                          currentDMI.adx > prevDMI.adx;
    
    const dmiConfirmSell = currentDMI.minusDI > currentDMI.plusDI && 
                           currentDMI.adx > 25 && 
                           currentDMI.adx > prevDMI.adx;

    // 7. Validar EMA50 (contexto de tendência)
    const currentPrice = triggerCandle.close;
    const ema50Confirm = ema50[ema50.length - 1];
    const trendUp = currentPrice > ema50Confirm;
    const trendDown = currentPrice < ema50Confirm;

    // 8. Filtros adicionais
    const avgATR = atr.slice(-100).reduce((a, b) => a + b, 0) / 100;
    const volatilityOk = atr[atr.length - 1] >= avgATR * 0.5;
    
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volumeOk = triggerCandle.volume >= avgVolume;

    // 9. Calcular Fibonacci adaptativo orientado pela direção
    let fiboLevels = null;
    let swingLow = null;
    let swingHigh = null;
    let direction = null;

    if (buyBreakout && pivotLows.length > 0 && pivotHighs.length > 0) {
      // Para compra: medir da última mínima até a última máxima
      const lastPivotLow = pivotLows[pivotLows.length - 1];
      const lastPivotHigh = pivotHighs[pivotHighs.length - 1];
      swingLow = lastPivotLow.value;
      swingHigh = lastPivotHigh.value;
      direction = 'buy';
      fiboLevels = calculateFibonacciLevels(swingLow, swingHigh, direction);
    } else if (sellBreakout && pivotHighs.length > 0 && pivotLows.length > 0) {
      // Para venda: medir da última máxima até a última mínima
      const lastPivotHigh = pivotHighs[pivotHighs.length - 1];
      const lastPivotLow = pivotLows[pivotLows.length - 1];
      swingLow = lastPivotLow.value;
      swingHigh = lastPivotHigh.value;
      direction = 'sell';
      fiboLevels = calculateFibonacciLevels(swingLow, swingHigh, direction);
    }

    // 10. Determinar TP e SL baseado na força do ADX
    const adxStrength = currentDMI.adx;
    const { tpLevel, slLevel } = getAdaptiveFibonacciTargets(adxStrength, direction);

    // 11. Calcular TP/SL usando Fibonacci
    let calculatedTP = null;
    let calculatedSL = null;
    let rrValidation = null;

    if (fiboLevels && direction) {
      const result = calculateTPSL(swingLow, swingHigh, adxStrength, direction, currentPrice);
      calculatedTP = result.tp;
      calculatedSL = result.sl;
      
      // Validar R:R mínimo de 1:1
      rrValidation = validateRiskReward(currentPrice, calculatedTP, calculatedSL, 1.0);
    }

    // 12. Salvar status das condições e Fibonacci
    setConditionsStatus({
      buy: {
        breakout: buyBreakout,
        didi: didiConfirmBuy,
        dmi: dmiConfirmBuy,
        trend: trendUp,
        volatility: volatilityOk,
        volume: volumeOk,
        rrValid: rrValidation?.isValid || false
      },
      sell: {
        breakout: sellBreakout,
        didi: didiConfirmSell,
        dmi: dmiConfirmSell,
        trend: trendDown,
        volatility: volatilityOk,
        volume: volumeOk,
        rrValid: rrValidation?.isValid || false
      },
      currentPrice,
      ema50Value: ema50Confirm,
      adx: currentDMI.adx,
      atrValue: atr[atr.length - 1],
      avgVolume,
      currentVolume: triggerCandle.volume,
      referenceHigh: referenceCandle.high,
      referenceLow: referenceCandle.low,
      fibonacci: fiboLevels,
      tpLevel,
      slLevel,
      rrRatio: rrValidation?.ratio || 0,
      direction
    });

    if (fiboLevels) {
      setFibonacciLevels(fiboLevels);
    }

    // 13. Atualizar status do sinal para UI
    if (buyBreakout && didiConfirmBuy && dmiConfirmBuy && trendUp && rrValidation?.isValid) {
      setSignalStatus('buy');
    } else if (sellBreakout && didiConfirmSell && dmiConfirmSell && trendDown && rrValidation?.isValid) {
      setSignalStatus('sell');
    } else {
      setSignalStatus('wait');
    }

    // 14. Gerar sinal com Fibonacci adaptativo e validação de R:R
    let signal = null;

    if (buyBreakout && didiConfirmBuy && dmiConfirmBuy && trendUp && volatilityOk && volumeOk && 
        fiboLevels && calculatedTP && calculatedSL && rrValidation?.isValid) {
      const entryPrice = triggerCandle.close;

      signal = {
        type: 'COMPRA',
        entryPrice,
        stopLoss: calculatedSL,
        takeProfit: calculatedTP,
        timestamp: new Date().toLocaleString('pt-BR'),
        confirmations: {
          didi: true,
          dmi: true,
          ema50: true,
          volatility: volatilityOk,
          volume: volumeOk,
          fibonacci: true,
          riskReward: true
        },
        adx: currentDMI.adx.toFixed(2),
        atr: atr[atr.length - 1].toFixed(2),
        fibonacciTP: tpLevel,
        fibonacciSL: slLevel,
        riskReward: rrValidation.ratio.toFixed(2),
        direction: 'buy'
      };

      setLastSignal(signal);
      setOperationHistory(prev => [signal, ...prev].slice(0, 50));
      setActiveOperation(signal);
      
      // Tocar som de alerta
      playSignalSound('buy');
      
      toast.success(`🟢 Sinal de COMPRA confirmado! R:R = ${rrValidation.ratio.toFixed(2)}:1`, {
        duration: 5000
      });
    } else if (sellBreakout && didiConfirmSell && dmiConfirmSell && trendDown && volatilityOk && volumeOk && 
               fiboLevels && calculatedTP && calculatedSL && rrValidation?.isValid) {
      const entryPrice = triggerCandle.close;

      signal = {
        type: 'VENDA',
        entryPrice,
        stopLoss: calculatedSL,
        takeProfit: calculatedTP,
        timestamp: new Date().toLocaleString('pt-BR'),
        confirmations: {
          didi: true,
          dmi: true,
          ema50: true,
          volatility: volatilityOk,
          volume: volumeOk,
          fibonacci: true,
          riskReward: true
        },
        adx: currentDMI.adx.toFixed(2),
        atr: atr[atr.length - 1].toFixed(2),
        fibonacciTP: tpLevel,
        fibonacciSL: slLevel,
        riskReward: rrValidation.ratio.toFixed(2),
        direction: 'sell'
      };

      setLastSignal(signal);
      setOperationHistory(prev => [signal, ...prev].slice(0, 50));
      setActiveOperation(signal);
      
      // Tocar som de alerta
      playSignalSound('sell');
      
      toast.success(`🔴 Sinal de VENDA confirmado! R:R = ${rrValidation.ratio.toFixed(2)}:1`, {
        duration: 5000
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Dados atualizados');
  };

  if (isLoading) return <LoadingSpinner message="Carregando dados ETHUSDT..." />;
  if (error) return <ErrorDisplay message="Erro ao carregar dados de mercado" />;

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20">
      {/* Header com gradiente e animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Estratégia ETHUSDT</h1>
              
              {/* Badge de Status WebSocket */}
              {isWebSocketConnected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                  <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                    Tempo Real
                  </Badge>
                </motion.div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              Análise automática com Didi Index + DMI + Rompimento (Timeframe: 15min)
            </p>
            
            {/* Badge de Sinal Atual */}
            <div className="flex items-center gap-2 mt-2">
              {signalStatus === 'buy' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <Badge className="bg-green-500 text-white hover:bg-green-600 text-sm px-3 py-1">
                    🟢 Sinal de Compra Ativo
                  </Badge>
                </motion.div>
              )}
              {signalStatus === 'sell' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <Badge className="bg-red-500 text-white hover:bg-red-600 text-sm px-3 py-1">
                    🔴 Sinal de Venda Ativo
                  </Badge>
                </motion.div>
              )}
              {signalStatus === 'wait' && (
                <Badge variant="outline" className="text-sm px-3 py-1 border-muted-foreground/30">
                  ⚪ Aguardando Condições
                </Badge>
              )}
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="self-end sm:self-auto hover:bg-primary/10 hover:border-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Métricas de Performance */}
      <StrategyMetrics 
        signals={operationHistory} 
        successfulSignals={successfulSignals} 
      />

      {/* Indicadores Técnicos Visuais */}
      <TechnicalGauges conditionsStatus={conditionsStatus} />

      {/* Gráfico de Candlestick */}
      <CandlestickChart marketData={marketData} lastSignal={lastSignal} />

      {/* Sinal Atual com Fibonacci */}
      {lastSignal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`border-2 ${lastSignal.type === 'COMPRA' ? 'border-green-500' : 'border-red-500'} ${activeOperation ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center justify-between gap-2 text-lg sm:text-xl">
                <div className="flex items-center gap-2">
                  {lastSignal.type === 'COMPRA' ? (
                    <ArrowUpCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <ArrowDownCircle className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                  Sinal de {lastSignal.type}
                </div>
                {activeOperation && (
                  <Badge variant="default" className="animate-pulse">
                    🔒 Operação Ativa
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Entrada</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold">${lastSignal.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Stop Loss (Fibo {lastSignal.fibonacciSL})</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-red-500">${lastSignal.stopLoss.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Take Profit (Fibo {lastSignal.fibonacciTP})</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-green-500">${lastSignal.takeProfit.toFixed(2)}</p>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Risco:Retorno</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-primary">1:{lastSignal.riskReward}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge variant={lastSignal.confirmations.didi ? "default" : "destructive"} className="text-xs">
                  Didi {lastSignal.confirmations.didi ? '✅' : '❌'}
                </Badge>
                <Badge variant={lastSignal.confirmations.dmi ? "default" : "destructive"} className="text-xs">
                  DMI {lastSignal.confirmations.dmi ? '✅' : '❌'}
                </Badge>
                <Badge variant={lastSignal.confirmations.ema50 ? "default" : "destructive"} className="text-xs">
                  EMA50 {lastSignal.confirmations.ema50 ? '✅' : '❌'}
                </Badge>
                <Badge variant={lastSignal.confirmations.fibonacci ? "default" : "destructive"} className="text-xs">
                  Fibonacci {lastSignal.confirmations.fibonacci ? '✅' : '❌'}
                </Badge>
                <Badge variant="outline" className="text-xs">ADX: {lastSignal.adx}</Badge>
                <Badge variant="outline" className="text-xs">ATR: {lastSignal.atr}</Badge>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-primary/5 p-2 rounded">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="leading-tight">
                  {activeOperation 
                    ? "🔒 Aguardando TP ou SL para liberar nova entrada" 
                    : "Fibonacci adaptativo baseado na força do ADX"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Timeline de Sinais */}
      <SignalTimeline 
        signals={operationHistory} 
        successfulSignals={successfulSignals} 
      />

      {/* Painel de Condições (colapsável) */}
      {conditionsStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                Status Detalhado das Condições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              {/* Condições de Compra */}
              <div>
                <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <ArrowUpCircle className="text-green-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Condições para COMPRA
                </h3>
                <div className="grid gap-1.5 sm:gap-2">
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Rompimento de Alta</span>
                    <Badge variant={conditionsStatus.buy.breakout ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.breakout ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Didi Index (Agulhada Alta)</span>
                    <Badge variant={conditionsStatus.buy.didi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.didi ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">DMI (+DI &gt; -DI, ADX &gt; 25)</span>
                    <Badge variant={conditionsStatus.buy.dmi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.dmi ? "✅ OK" : "❌ Não"} (ADX: {conditionsStatus.adx.toFixed(1)})
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Tendência (Preço &gt; EMA50)</span>
                    <Badge variant={conditionsStatus.buy.trend ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.trend ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volatilidade Adequada</span>
                    <Badge variant={conditionsStatus.buy.volatility ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.volatility ? "✅ OK" : "❌ Baixa"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volume Adequado</span>
                    <Badge variant={conditionsStatus.buy.volume ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.volume ? "✅ OK" : "❌ Baixo"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Condições de Venda */}
              <div>
                <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <ArrowDownCircle className="text-red-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Condições para VENDA
                </h3>
                <div className="grid gap-1.5 sm:gap-2">
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Rompimento de Baixa</span>
                    <Badge variant={conditionsStatus.sell.breakout ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.breakout ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Didi Index (Agulhada Baixa)</span>
                    <Badge variant={conditionsStatus.sell.didi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.didi ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">DMI (-DI &gt; +DI, ADX &gt; 25)</span>
                    <Badge variant={conditionsStatus.sell.dmi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.dmi ? "✅ OK" : "❌ Não"} (ADX: {conditionsStatus.adx.toFixed(1)})
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Tendência (Preço &lt; EMA50)</span>
                    <Badge variant={conditionsStatus.sell.trend ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.trend ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volatilidade Adequada</span>
                    <Badge variant={conditionsStatus.sell.volatility ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.volatility ? "✅ OK" : "❌ Baixa"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volume Adequado</span>
                    <Badge variant={conditionsStatus.sell.volume ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.volume ? "✅ OK" : "❌ Baixo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Descrição da Estratégia */}
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Sobre a Estratégia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm p-4 sm:p-6 pt-0">
          <p><strong>Timeframe:</strong> 15 minutos</p>
          <p><strong>Ativo:</strong> ETHUSDT</p>
          <p><strong>Indicadores:</strong> Didi Index, DMI (ADX), EMA50, ATR, Fibonacci Adaptativo</p>
          <p><strong>Lógica de Entrada:</strong> Identifica pivôs (máximas/mínimas significativas) e rompimento do candle de referência com confirmações de Didi, DMI e EMA50.</p>
          <p><strong>Fibonacci Adaptativo:</strong> Detecta pernadas de movimento e aplica níveis de Fibonacci para TP e SL dinâmicos.</p>
          <p><strong>Gestão Inteligente:</strong> TP e SL ajustados pela força do ADX:
            <br/>• ADX &gt; 40: TP agressivo (Fibo 0.618), SL apertado (0.5)
            <br/>• ADX 30-40: TP moderado (Fibo 0.5), SL moderado (0.618)
            <br/>• ADX 25-30: TP conservador (Fibo 0.382), SL largo (0.786)
          </p>
          <p><strong>Bloqueio de Entrada:</strong> Não permite novas operações até que TP ou SL sejam atingidos.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaETH;
