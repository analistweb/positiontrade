import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Radio,
  GitBranch,
  Zap,
  BarChart3,
  Target,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';
import { fetchETHUSDTData } from '@/services/binanceService';
import { useBinanceKlineStream } from '@/services/binanceSocket';
import { showSignalNotification } from '@/components/strategy/SignalNotification';
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
  validateRiskReward,
  detectSwing,
  computeLeg,
  getAdaptiveFib,
  calculateAdaptiveTPSL
} from '@/utils/technicalIndicators';
import {
  calculateOBV,
  calculateVROC,
  calculateVolumeProfile,
  calculateRSI,
  calculateMACD,
  calculateBreakoutStrength,
  calculateMarketStrength
} from '@/utils/advancedIndicators';
import {
  validateIntrabarBreakout,
  validateIntrabarFilters,
  logIntrabarExecution,
  calculateDynamicBreakEven
} from '@/utils/intrabarDetection';
import StrategyMetrics from '@/components/strategy/StrategyMetrics';
import TechnicalGauges from '@/components/strategy/TechnicalGauges';
import CandlestickChart from '@/components/strategy/CandlestickChart';
import SignalTimeline from '@/components/strategy/SignalTimeline';
import SignalStrengthIndicator from '@/components/strategy/SignalStrengthIndicator';
import ParametersPanel from '@/components/strategy/ParametersPanel';
import ConfluenceTriangle from '@/components/strategy/ConfluenceTriangle';
import DiagnosticPanel from '@/components/strategy/DiagnosticPanel';
import ConnectionStatus from '@/components/strategy/ConnectionStatus';
import BacktestPanel from '@/components/strategy/BacktestPanel';
import { logger } from '@/utils/logger';
import { defaultStrategyConfig as STRATEGY_CONFIG, getAllVersions, ACTIVE_VERSION, APPROVAL_CRITERIA } from '@/config/strategyConfig';

// Schema de validação para dados do candle recebidos do WebSocket
const candleDataSchema = z.object({
  timestamp: z.number().positive(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
  isClosed: z.boolean()
});

const EstrategiaETH = () => {
  const [lastSignal, setLastSignal] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);
  const [successfulSignals, setSuccessfulSignals] = useState([]);
  const [conditionsStatus, setConditionsStatus] = useState(null);
  const [activeOperation, setActiveOperation] = useState(null);
  const [fibonacciLevels, setFibonacciLevels] = useState(null);
  const [signalStatus, setSignalStatus] = useState('wait'); // 'buy', 'sell', 'wait'
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [recentTicks, setRecentTicks] = useState([]); // MÓDULO B: Track últimos 3 ticks
  const [intrabarCandle, setIntrabarCandle] = useState(null); // MÓDULO B: Candle em formação
  const [parameters, setParameters] = useState({
    scoreThreshold: 60, // Reduzido de 70 para 60 para capturar mais sinais
    minRR: 1.0,
    adxMin: 25, // Reduzido de 27 para 25
    rsiOverbought: 75, // Aumentado de 70 para 75
    rsiOversold: 25 // Reduzido de 30 para 25
  });
  
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

  // WebSocket para updates em tempo real com validação
  const handleNewKline = (klineData) => {
    // Validar dados recebidos do WebSocket
    const validation = candleDataSchema.safeParse(klineData);
    
    if (validation.success) {
      if (import.meta.env.DEV) {
        console.log('[EstrategiaETH] Candle validado:', validation.data);
      }
      
      // MÓDULO B: Processar dados intrabar
      const candle = validation.data;
      
      // Atualizar candle em formação
      setIntrabarCandle(candle);
      
      // Atualizar histórico de ticks (últimos 3)
      setRecentTicks(prev => {
        const updated = [...prev, { high: candle.high, low: candle.low, close: candle.close }];
        return updated.slice(-3); // Manter apenas últimos 3 ticks
      });
      
      // Se candle fechou, limpar ticks e refetch
      if (candle.isClosed) {
        setRecentTicks([]);
        setIntrabarCandle(null);
        refetch();
      }
    } else {
      toast.error('Dados de mercado inválidos recebidos');
      if (import.meta.env.DEV) {
        console.error('[EstrategiaETH] Validação falhou:', validation.error.issues);
      }
    }
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
    const previousCandle = data.length >= 2 ? data[data.length - 2] : data[data.length - 1];
    
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

      // ==================== MÓDULO B: BREAK-EVEN DINÂMICO ====================
      // Calcular aceleração do OBV
      const closes = data.map(d => d.close);
      const volumes = data.map(d => d.volume);
      const obv = calculateOBV(closes, volumes);
      
      const obvCurrent = obv[obv.length - 1];
      const obvPrevious = obv[obv.length - 10] || obv[0];
      const obvAcceleration = ((obvCurrent - obvPrevious) / Math.abs(obvPrevious)) * 100;
      
      // Aplicar break-even dinâmico se não atingiu TP/SL ainda
      if (!hitTP && !hitSL) {
        const breakEvenResult = calculateDynamicBreakEven(
          activeOperation,
          currentPrice,
          obvAcceleration,
          previousCandle
        );
        
        if (breakEvenResult.breakEvenActivated || breakEvenResult.tpExtended) {
          console.log('🔄 Atualizando operação com break-even dinâmico:', breakEvenResult);
          
          setActiveOperation(prev => ({
            ...prev,
            stopLoss: breakEvenResult.newSL,
            takeProfit: breakEvenResult.newTP,
            breakEvenActivated: breakEvenResult.breakEvenActivated,
            tpExtended: breakEvenResult.tpExtended
          }));
          
          // Toastar notificação
          if (breakEvenResult.breakEvenActivated) {
            toast.success('🔄 Break-even ativado! SL movido para proteção.', {
              description: `Novo SL: ${breakEvenResult.newSL.toFixed(2)}`
            });
          }
          if (breakEvenResult.tpExtended) {
            toast.success('📈 TP estendido devido à aceleração do mercado!', {
              description: `Novo TP: ${breakEvenResult.newTP.toFixed(2)}`
            });
          }
        }
      }

      if (hitTP) {
        // Calcular lucro: sempre positivo para TP
        const profitPercent = activeOperation.type === 'COMPRA' 
          ? ((activeOperation.takeProfit - activeOperation.entryPrice) / activeOperation.entryPrice * 100).toFixed(2)
          : ((activeOperation.entryPrice - activeOperation.takeProfit) / activeOperation.entryPrice * 100).toFixed(2);

        console.log('✅ Take Profit atingido:', {
          tipo: activeOperation.type,
          entrada: activeOperation.entryPrice,
          tp: activeOperation.takeProfit,
          lucro: profitPercent
        });

        const successSignal = {
          ...activeOperation,
          closedAt: new Date().toLocaleString('pt-BR'),
          profit: profitPercent,
          status: 'SUCESSO'
        };

        setSuccessfulSignals(prev => [successSignal, ...prev].slice(0, 50));
        setActiveOperation(null);
        showSignalNotification(successSignal, 'tp');
        playSignalSound('sell'); // Som de venda (fim da operação)
      } else if (hitSL) {
        // Calcular perda: sempre negativo para SL
        const lossPercent = activeOperation.type === 'COMPRA' 
          ? ((activeOperation.stopLoss - activeOperation.entryPrice) / activeOperation.entryPrice * 100).toFixed(2)
          : ((activeOperation.entryPrice - activeOperation.stopLoss) / activeOperation.entryPrice * 100).toFixed(2);

        console.log('🛑 Stop Loss atingido:', {
          tipo: activeOperation.type,
          entrada: activeOperation.entryPrice,
          sl: activeOperation.stopLoss,
          perda: lossPercent
        });

        const lossSignal = {
          ...activeOperation,
          closedAt: new Date().toLocaleString('pt-BR'),
          profit: lossPercent,
          status: 'STOP LOSS'
        };

        setSuccessfulSignals(prev => [lossSignal, ...prev].slice(0, 50));
        setActiveOperation(null);
        showSignalNotification(lossSignal, 'sl');
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

    // 3. Calcular indicadores técnicos básicos
    const didiIndex = calculateDidiIndex(closes);
    const dmi = calculateDMI(highs, lows, closes);
    const atr = calculateATR(highs, lows, closes, 14);
    const ema50 = calculateEMA(closes, 50);

    // 3.1 Calcular indicadores avançados (FASE 1)
    const obv = calculateOBV(closes, volumes);
    const vroc = calculateVROC(volumes, 14);
    const volumeProfile = calculateVolumeProfile(closes.slice(-100), volumes.slice(-100));
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    
    // Tendência do OBV
    const obvTrend = obv[obv.length - 1] > obv[obv.length - 5] ? 'up' : 'down';
    const obvConfirm = obvTrend === 'up' ? 'bullish' : 'bearish';

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

    // 8. Filtros adicionais aprimorados (FASE 1)
    const avgATR = atr.slice(-100).reduce((a, b) => a + b, 0) / 100;
    const volatilityOk = atr[atr.length - 1] >= avgATR * 0.5;
    
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volumeOk = triggerCandle.volume >= avgVolume;

    // 8.1 Validação de RSI (ampliado para capturar tendências fortes)
    const currentRSI = rsi[rsi.length - 1];
    const rsiOkForBuy = currentRSI >= 30 && currentRSI <= 80; // Ampliado: antes 40-70
    const rsiOkForSell = currentRSI >= 20 && currentRSI <= 70; // Ampliado: antes 30-60

    // 8.2 Confirmação MACD
    const currentMACD = macd.histogram[macd.histogram.length - 1];
    const prevMACD = macd.histogram[macd.histogram.length - 2];
    const macdBullish = currentMACD > 0 && currentMACD > prevMACD;
    const macdBearish = currentMACD < 0 && currentMACD < prevMACD;

    // 8.3 Análise de força do breakout
    let breakoutStrengthBuy = null;
    let breakoutStrengthSell = null;
    
    if (buyBreakout) {
      breakoutStrengthBuy = calculateBreakoutStrength(
        triggerCandle.volume,
        avgVolume,
        triggerCandle.close,
        referenceCandle.high,
        referenceCandle.low,
        'buy'
      );
    }
    
    if (sellBreakout) {
      breakoutStrengthSell = calculateBreakoutStrength(
        triggerCandle.volume,
        avgVolume,
        triggerCandle.close,
        referenceCandle.high,
        referenceCandle.low,
        'sell'
      );
    }

    // 8.4 Score de força do mercado
    const marketStrengthScore = calculateMarketStrength({
      rsi: currentRSI,
      macdHistogram: currentMACD,
      macdHistogramPrev: prevMACD,
      volumeRatio: triggerCandle.volume / avgVolume,
      obvTrend
    });

    // ==================== MÓDULO A: SWING DETECTION + FIBO ADAPTATIVO ====================
    // 9. Detectar Swings com lookback maior (20) e menor (5)
    const swings = detectSwing(highs, lows, 20, 5);
    const { swingHigh, swingLow } = swings;
    
    // 9.1 Calcular pernada (leg) se houver swings válidos
    let leg = null;
    if (swingHigh && swingLow) {
      leg = computeLeg(swingHigh, swingLow);
      console.log('📐 Pernada calculada:', {
        legSize: leg.legSize?.toFixed(2),
        direction: leg.direction,
        from: leg.from?.toFixed(2),
        to: leg.to?.toFixed(2)
      });
    }
    
    // 9.2 Calcular TP/SL com Fibonacci Adaptativo (baseado em ADX)
    let calculatedTP = null;
    let calculatedSL = null;
    let rrValidation = null;
    let direction = null;
    let fibUsed = null;
    
    const adxStrength = currentDMI.adx;
    
    if (buyBreakout && swingHigh && swingLow) {
      direction = 'buy';
      const result = calculateAdaptiveTPSL(
        currentPrice,
        swingHigh,
        swingLow,
        adxStrength,
        direction
      );
      
      calculatedTP = result.tp;
      calculatedSL = result.sl;
      fibUsed = result.fibUsed;
      
      if (calculatedTP && calculatedSL) {
        rrValidation = validateRiskReward(currentPrice, calculatedTP, calculatedSL, parameters.minRR);
        
        console.log('🟢 COMPRA - TP/SL Adaptativos:', {
          entrada: currentPrice.toFixed(2),
          tp: calculatedTP.toFixed(2),
          sl: calculatedSL.toFixed(2),
          tpFib: fibUsed?.tpFib,
          slFib: fibUsed?.slFib,
          legSize: result.legSize?.toFixed(2),
          rr: rrValidation?.ratio?.toFixed(2),
          adx: adxStrength.toFixed(2)
        });
      }
    } else if (sellBreakout && swingHigh && swingLow) {
      direction = 'sell';
      const result = calculateAdaptiveTPSL(
        currentPrice,
        swingHigh,
        swingLow,
        adxStrength,
        direction
      );
      
      calculatedTP = result.tp;
      calculatedSL = result.sl;
      fibUsed = result.fibUsed;
      
      if (calculatedTP && calculatedSL) {
        rrValidation = validateRiskReward(currentPrice, calculatedTP, calculatedSL, parameters.minRR);
        
        console.log('🔴 VENDA - TP/SL Adaptativos:', {
          entrada: currentPrice.toFixed(2),
          tp: calculatedTP.toFixed(2),
          sl: calculatedSL.toFixed(2),
          tpFib: fibUsed?.tpFib,
          slFib: fibUsed?.slFib,
          legSize: result.legSize?.toFixed(2),
          rr: rrValidation?.ratio?.toFixed(2),
          adx: adxStrength.toFixed(2)
        });
      }
    }

    // ==================== MÓDULO B: VALIDAÇÃO INTRABAR ====================
    // 10. Validar rompimento intrabar se houver candle em formação
    let intrabarBreakoutValid = null;
    if (intrabarCandle && !intrabarCandle.isClosed) {
      const atr15 = atr[atr.length - 1];
      
      if (buyBreakout) {
        intrabarBreakoutValid = validateIntrabarBreakout(
          intrabarCandle,
          referenceCandle,
          avgVolume,
          atr15,
          recentTicks,
          'buy'
        );
        
        if (!intrabarBreakoutValid.isValid) {
          console.log('⚠️ Rompimento INTRABAR COMPRA invalidado:', intrabarBreakoutValid.reason);
        } else {
          console.log('✅ Rompimento INTRABAR COMPRA válido:', intrabarBreakoutValid);
        }
      } else if (sellBreakout) {
        intrabarBreakoutValid = validateIntrabarBreakout(
          intrabarCandle,
          referenceCandle,
          avgVolume,
          atr15,
          recentTicks,
          'sell'
        );
        
        if (!intrabarBreakoutValid.isValid) {
          console.log('⚠️ Rompimento INTRABAR VENDA invalidado:', intrabarBreakoutValid.reason);
        } else {
          console.log('✅ Rompimento INTRABAR VENDA válido:', intrabarBreakoutValid);
        }
      }
    }
    
    // 10.1 Validar todos os filtros do setup com score >= 70
    let filtersValid = null;
    if (direction && (buyBreakout || sellBreakout)) {
      filtersValid = validateIntrabarFilters(
        {
          ema50Aligned: direction === 'buy' ? trendUp : trendDown,
          adx: adxStrength,
          macdGrowing: direction === 'buy' ? macdBullish : macdBearish,
          macdHistogramGrowing: direction === 'buy' ? 
            (currentMACD > prevMACD) : (currentMACD < prevMACD),
          rsiValue: currentRSI,
          obvConfirming: direction === 'buy' ? (obvConfirm === 'bullish') : (obvConfirm === 'bearish'),
          volumeAboveAvg: volumeOk,
          breakoutStrength: direction === 'buy' ? 
            (breakoutStrengthBuy?.strength || 0) : (breakoutStrengthSell?.strength || 0)
        },
        direction,
        parameters.scoreThreshold
      );
      
      console.log(`📊 Filtros ${direction.toUpperCase()} - Score:`, {
        score: filtersValid.score,
        threshold: filtersValid.threshold,
        isValid: filtersValid.isValid,
        checks: filtersValid.checks
      });
    }

    // 12. Salvar status das condições (atualizado MÓDULOS A e B)
    setConditionsStatus({
      buy: {
        breakout: buyBreakout,
        didi: didiConfirmBuy,
        dmi: dmiConfirmBuy,
        trend: trendUp,
        volatility: volatilityOk,
        volume: volumeOk,
        rsi: rsiOkForBuy,
        macd: macdBullish,
        obv: obvConfirm === 'bullish',
        breakoutStrength: breakoutStrengthBuy?.strength || 0,
        rrValid: rrValidation?.isValid || false,
        intrabarValid: intrabarBreakoutValid?.isValid || false,
        scoreValid: filtersValid?.isValid || false,
        score: filtersValid?.score || 0
      },
      sell: {
        breakout: sellBreakout,
        didi: didiConfirmSell,
        dmi: dmiConfirmSell,
        trend: trendDown,
        volatility: volatilityOk,
        volume: volumeOk,
        rsi: rsiOkForSell,
        macd: macdBearish,
        obv: obvConfirm === 'bearish',
        breakoutStrength: breakoutStrengthSell?.strength || 0,
        rrValid: rrValidation?.isValid || false,
        intrabarValid: intrabarBreakoutValid?.isValid || false,
        scoreValid: filtersValid?.isValid || false,
        score: filtersValid?.score || 0
      },
      currentPrice,
      ema50Value: ema50Confirm,
      adx: currentDMI.adx,
      atrValue: atr[atr.length - 1],
      avgVolume,
      currentVolume: triggerCandle.volume,
      referenceHigh: referenceCandle.high,
      referenceLow: referenceCandle.low,
      fibonacci: fibUsed,
      rrRatio: rrValidation?.ratio || 0,
      direction,
      rsi: currentRSI,
      macdValue: currentMACD,
      obvValue: obv[obv.length - 1],
      obvTrend,
      marketStrength: marketStrengthScore,
      volumeProfile: volumeProfile.pocPrice,
      // Módulo A dados
      swingHigh: swingHigh?.value,
      swingLow: swingLow?.value,
      legSize: leg?.legSize,
      legDirection: leg?.direction
    });

    // 13. Atualizar status do sinal para UI (MÓDULO B: usar score)
    const signalQualityBuy = buyBreakout && 
                              calculatedTP && calculatedSL && 
                              rrValidation?.isValid &&
                              filtersValid?.isValid && 
                              filtersValid?.score >= parameters.scoreThreshold;
    
    const signalQualitySell = sellBreakout && 
                               calculatedTP && calculatedSL && 
                               rrValidation?.isValid &&
                               filtersValid?.isValid && 
                               filtersValid?.score >= parameters.scoreThreshold;

    if (signalQualityBuy) {
      setSignalStatus('buy');
    } else if (signalQualitySell) {
      setSignalStatus('sell');
    } else {
      setSignalStatus('wait');
    }

    // 14. Gerar sinal com validações MÓDULOS A + B
    let signal = null;

    if (signalQualityBuy && calculatedTP && calculatedSL) {
      const entryPrice = currentPrice;

      // Validação: Para COMPRA, TP deve ser > entrada > SL
      if (calculatedTP <= entryPrice || calculatedSL >= entryPrice) {
        console.error('❌ ERRO: Níveis TP/SL inválidos para COMPRA:', {
          entrada: entryPrice,
          tp: calculatedTP,
          sl: calculatedSL
        });
        return;
      }

      signal = {
        type: 'COMPRA',
        entryPrice,
        stopLoss: calculatedSL,
        takeProfit: calculatedTP,
        timestamp: new Date().toLocaleString('pt-BR'),
        confirmations: {
          didi: didiConfirmBuy,
          dmi: dmiConfirmBuy,
          ema50: trendUp,
          volatility: volatilityOk,
          volume: volumeOk,
          fibonacci: true,
          riskReward: rrValidation.isValid,
          rsi: rsiOkForBuy,
          macd: macdBullish,
          obv: obvConfirm === 'bullish',
          breakoutStrength: breakoutStrengthBuy?.strength || 0,
          marketStrength: marketStrengthScore,
          score: filtersValid.score,
          intrabar: intrabarBreakoutValid?.isValid || false
        },
        adx: currentDMI.adx.toFixed(2),
        atr: atr[atr.length - 1].toFixed(2),
        fibonacciUsed: fibUsed,
        riskReward: rrValidation.ratio.toFixed(2),
        direction: 'buy',
        score: filtersValid.score
      };

      console.log('🟢 Sinal de COMPRA gerado:', {
        entrada: entryPrice.toFixed(2),
        tp: calculatedTP.toFixed(2),
        sl: calculatedSL.toFixed(2),
        rr: rrValidation.ratio.toFixed(2),
        score: filtersValid.score
      });

      setLastSignal(signal);
      setActiveOperation(signal);
      showSignalNotification(signal, 'signal');
      playSignalSound('buy');
      
      // MÓDULO B: Log avançado para auditoria
      logIntrabarExecution({
        tickActivation: recentTicks.length > 0 ? recentTicks[0] : null,
        tickConfirmation: recentTicks.length >= 3 ? recentTicks[2] : null,
        atrIntrabar: atr[atr.length - 1],
        volumeProjected: intrabarBreakoutValid?.volumeProjected || triggerCandle.volume,
        scoreIntrabar: filtersValid.score,
        adxMoment: currentDMI.adx,
        rrRatio: rrValidation.ratio,
        fibUsed: fibUsed,
        entryPrice,
        tp: calculatedTP,
        sl: calculatedSL,
        direction: 'buy'
      });

    } else if (signalQualitySell && calculatedTP && calculatedSL) {
      const entryPrice = currentPrice;

      // Validação: Para VENDA, SL deve ser > entrada > TP
      if (calculatedTP >= entryPrice || calculatedSL <= entryPrice) {
        console.error('❌ ERRO: Níveis TP/SL inválidos para VENDA:', {
          entrada: entryPrice,
          tp: calculatedTP,
          sl: calculatedSL
        });
        return;
      }

      signal = {
        type: 'VENDA',
        entryPrice,
        stopLoss: calculatedSL,
        takeProfit: calculatedTP,
        timestamp: new Date().toLocaleString('pt-BR'),
        confirmations: {
          didi: didiConfirmSell,
          dmi: dmiConfirmSell,
          ema50: trendDown,
          volatility: volatilityOk,
          volume: volumeOk,
          fibonacci: true,
          riskReward: rrValidation.isValid,
          rsi: rsiOkForSell,
          macd: macdBearish,
          obv: obvConfirm === 'bearish',
          breakoutStrength: breakoutStrengthSell?.strength || 0,
          marketStrength: marketStrengthScore,
          score: filtersValid.score,
          intrabar: intrabarBreakoutValid?.isValid || false
        },
        adx: currentDMI.adx.toFixed(2),
        atr: atr[atr.length - 1].toFixed(2),
        fibonacciUsed: fibUsed,
        riskReward: rrValidation.ratio.toFixed(2),
        direction: 'sell',
        score: filtersValid.score
      };

      console.log('🔴 Sinal de VENDA gerado:', {
        entrada: entryPrice.toFixed(2),
        tp: calculatedTP.toFixed(2),
        sl: calculatedSL.toFixed(2),
        rr: rrValidation.ratio.toFixed(2),
        score: filtersValid.score
      });

      setLastSignal(signal);
      setActiveOperation(signal);
      showSignalNotification(signal, 'signal');
      playSignalSound('sell');
      
      // MÓDULO B: Log avançado para auditoria
      logIntrabarExecution({
        tickActivation: recentTicks.length > 0 ? recentTicks[0] : null,
        tickConfirmation: recentTicks.length >= 3 ? recentTicks[2] : null,
        atrIntrabar: atr[atr.length - 1],
        volumeProjected: intrabarBreakoutValid?.volumeProjected || triggerCandle.volume,
        scoreIntrabar: filtersValid.score,
        adxMoment: currentDMI.adx,
        rrRatio: rrValidation.ratio,
        fibUsed: fibUsed,
        entryPrice,
        tp: calculatedTP,
        sl: calculatedSL,
        direction: 'sell'
      });
    }

    if (signal) {
      setOperationHistory(prev => [signal, ...prev].slice(0, 100));
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Dados atualizados');
  };

  if (isLoading) return <LoadingSpinner message="Carregando dados ETHUSDT..." />;
  if (error) return <ErrorDisplay message="Erro ao carregar dados de mercado" />;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header with Strategy Version */}
      <div className="strategy-hero border-b border-border/50 mb-6">
        <div className="strategy-hero-glow" />
        <div className="relative container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-muted flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  {signalStatus !== 'wait' && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${
                      signalStatus === 'buy' ? 'bg-success' : 'bg-danger'
                    }`}>
                      {signalStatus === 'buy' ? (
                        <ArrowUpCircle className="w-3 h-3 text-success-foreground" />
                      ) : (
                        <ArrowDownCircle className="w-3 h-3 text-danger-foreground" />
                      )}
                    </div>
                  )}
                </motion.div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Estratégia ETHUSDT</h1>
                    <ConnectionStatus 
                      wsConnected={isWebSocketConnected}
                      apiStatus="ok"
                      lastUpdate={new Date()}
                      latencyMs={50}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Análise automática com Didi Index + DMI + Rompimento
                  </p>
                </div>
              </div>

              {/* Version & Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="version-badge version-badge-active gap-1.5">
                  <GitBranch className="w-3 h-3" />
                  Engine {ACTIVE_VERSION}
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Clock className="w-3 h-3" />
                  M15
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <BarChart3 className="w-3 h-3" />
                  ETHUSDT
                </Badge>
                
                {/* Signal Status Badge */}
                {signalStatus === 'buy' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <Badge className="bg-success text-success-foreground gap-1 animate-pulse">
                      <ArrowUpCircle className="w-3 h-3" />
                      Sinal de Compra Ativo
                    </Badge>
                  </motion.div>
                )}
                {signalStatus === 'sell' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <Badge className="bg-danger text-danger-foreground gap-1 animate-pulse">
                      <ArrowDownCircle className="w-3 h-3" />
                      Sinal de Venda Ativo
                    </Badge>
                  </motion.div>
                )}
                {signalStatus === 'wait' && (
                  <Badge variant="secondary" className="gap-1">
                    <Activity className="w-3 h-3" />
                    Aguardando Condições
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Section - Quick Stats & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Quick Stats Cards */}
              <div className="flex items-center gap-3">
                <div className="metric-card flex flex-col items-center px-4 py-2 min-w-[80px]">
                  <span className="text-xs text-muted-foreground mb-1">Sinais</span>
                  <span className="font-bold text-lg">{operationHistory.length}</span>
                </div>
                <div className="metric-card flex flex-col items-center px-4 py-2 min-w-[80px]">
                  <span className="text-xs text-muted-foreground mb-1">Win Rate</span>
                  <span className="font-bold text-lg text-success">
                    {successfulSignals.filter(s => s.status === 'SUCESSO').length > 0 
                      ? Math.round((successfulSignals.filter(s => s.status === 'SUCESSO').length / successfulSignals.length) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="gap-2 hover:bg-primary/10 hover:border-primary transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de Performance */}
      <StrategyMetrics 
        signals={operationHistory} 
        successfulSignals={successfulSignals} 
      />

      {/* Indicadores Técnicos Visuais */}
      <TechnicalGauges conditionsStatus={conditionsStatus} />

      {/* Indicador de Força do Sinal - FASE 2 */}
      <SignalStrengthIndicator 
        conditionsStatus={conditionsStatus} 
        signalStatus={signalStatus}
      />

      {/* Triângulo de Confluência */}
      <ConfluenceTriangle
        trendScore={conditionsStatus ? (conditionsStatus.buy?.trend || conditionsStatus.sell?.trend ? 75 : 25) : 0}
        volumeScore={conditionsStatus?.buy?.volume ? 80 : conditionsStatus?.sell?.volume ? 80 : 30}
        momentumScore={conditionsStatus?.marketStrength || 0}
        details={{
          ema50Aligned: conditionsStatus?.buy?.trend || conditionsStatus?.sell?.trend,
          htfAligned: conditionsStatus?.adx > 25,
          vwapAligned: true,
          volumeRatio: conditionsStatus?.currentVolume / (conditionsStatus?.avgVolume || 1),
          volumeAboveAvg: conditionsStatus?.buy?.volume || conditionsStatus?.sell?.volume,
          obvAligned: conditionsStatus?.buy?.obv || conditionsStatus?.sell?.obv,
          vrocPositive: true,
          rsi: conditionsStatus?.rsi,
          rsiValid: conditionsStatus?.buy?.rsi || conditionsStatus?.sell?.rsi,
          macdGrowing: conditionsStatus?.buy?.macd || conditionsStatus?.sell?.macd,
          adx: conditionsStatus?.adx
        }}
      />

      {/* Painel de Diagnóstico do Score */}
      <DiagnosticPanel
        signal={lastSignal}
        conditionsStatus={conditionsStatus}
        parameters={parameters}
        configVersion={STRATEGY_CONFIG.version}
      />

      {/* Painel de Backtest e Monte Carlo */}
      <BacktestPanel symbol="ETHUSDT" />

      {/* Gráfico de Candlestick */}
      <CandlestickChart marketData={marketData} lastSignal={lastSignal} />

      {/* Sinal Atual com Fibonacci */}
      {lastSignal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`signal-card overflow-hidden ${
            lastSignal.type === 'COMPRA' ? 'signal-card-buy' : 'signal-card-sell'
          } ${activeOperation ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
            <CardHeader className="p-4 sm:p-6 border-b border-border/30">
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    lastSignal.type === 'COMPRA' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-danger/20 text-danger'
                  }`}>
                    {lastSignal.type === 'COMPRA' ? (
                      <ArrowUpCircle className="w-5 h-5" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-lg font-bold">Sinal de {lastSignal.type}</span>
                    <p className="text-xs text-muted-foreground font-normal">
                      Score: {lastSignal.score}% • R:R {lastSignal.riskReward}
                    </p>
                  </div>
                </div>
                {activeOperation && (
                  <Badge className="bg-primary/20 text-primary border border-primary/30 gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Operação Ativa
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Price Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="metric-card">
                  <p className="text-xs text-muted-foreground mb-1">Entrada</p>
                  <p className="metric-value">${lastSignal.entryPrice.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-danger flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3" /> Stop Loss
                  </p>
                  <p className="metric-value-danger">${lastSignal.stopLoss.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-success flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3" /> Take Profit
                  </p>
                  <p className="metric-value-success">${lastSignal.takeProfit.toFixed(2)}</p>
                </div>
                <div className="metric-card col-span-2 lg:col-span-1">
                  <p className="text-xs text-muted-foreground mb-1">Risco:Retorno</p>
                  <p className="text-2xl font-bold text-primary">1:{lastSignal.riskReward}</p>
                </div>
              </div>

              {/* Confirmations */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={lastSignal.confirmations.didi ? "default" : "secondary"} className="gap-1">
                  {lastSignal.confirmations.didi ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Didi
                </Badge>
                <Badge variant={lastSignal.confirmations.dmi ? "default" : "secondary"} className="gap-1">
                  {lastSignal.confirmations.dmi ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  DMI
                </Badge>
                <Badge variant={lastSignal.confirmations.ema50 ? "default" : "secondary"} className="gap-1">
                  {lastSignal.confirmations.ema50 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  EMA50
                </Badge>
                <Badge variant={lastSignal.confirmations.fibonacci ? "default" : "secondary"} className="gap-1">
                  {lastSignal.confirmations.fibonacci ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Fibonacci
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  ADX: {lastSignal.adx}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Activity className="w-3 h-3" />
                  ATR: {lastSignal.atr}
                </Badge>
              </div>

              {/* Info Banner */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {activeOperation 
                    ? "Aguardando TP ou SL para liberar nova entrada" 
                    : "Fibonacci adaptativo baseado na força do ADX"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Painel de Personalização - FASE 2 */}
      <ParametersPanel 
        onParametersChange={(params) => {
          console.log('Novos parâmetros aplicados:', params);
          // TODO: Integrar parâmetros na lógica de sinais
        }}
      />

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
          <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6 border-b border-border/30 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-primary" />
                Status Detalhado das Condições
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Condições de Compra */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center">
                      <ArrowUpCircle className="w-4 h-4 text-success" />
                    </div>
                    Condições para COMPRA
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Rompimento de Alta', value: conditionsStatus.buy.breakout },
                      { label: 'Didi Index (Agulhada)', value: conditionsStatus.buy.didi },
                      { label: 'DMI (+DI > -DI)', value: conditionsStatus.buy.dmi, extra: `ADX: ${conditionsStatus.adx.toFixed(1)}` },
                      { label: 'Tendência (Preço > EMA50)', value: conditionsStatus.buy.trend },
                      { label: 'Volatilidade Adequada', value: conditionsStatus.buy.volatility },
                      { label: 'Volume Adequado', value: conditionsStatus.buy.volume },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                          item.value 
                            ? 'bg-success/5 border-success/20' 
                            : 'bg-muted/30 border-border/50'
                        }`}
                      >
                        <span className="text-foreground-muted">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.extra && <span className="text-muted-foreground">{item.extra}</span>}
                          {item.value ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Condições de Venda */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-danger/20 flex items-center justify-center">
                      <ArrowDownCircle className="w-4 h-4 text-danger" />
                    </div>
                    Condições para VENDA
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Rompimento de Baixa', value: conditionsStatus.sell.breakout },
                      { label: 'Didi Index (Agulhada)', value: conditionsStatus.sell.didi },
                      { label: 'DMI (-DI > +DI)', value: conditionsStatus.sell.dmi, extra: `ADX: ${conditionsStatus.adx.toFixed(1)}` },
                      { label: 'Tendência (Preço < EMA50)', value: conditionsStatus.sell.trend },
                      { label: 'Volatilidade Adequada', value: conditionsStatus.sell.volatility },
                      { label: 'Volume Adequado', value: conditionsStatus.sell.volume },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                          item.value 
                            ? 'bg-danger/5 border-danger/20' 
                            : 'bg-muted/30 border-border/50'
                        }`}
                      >
                        <span className="text-foreground-muted">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.extra && <span className="text-muted-foreground">{item.extra}</span>}
                          {item.value ? (
                            <CheckCircle2 className="w-4 h-4 text-danger" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Descrição da Estratégia */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Sobre a Estratégia
            <Badge className="version-badge version-badge-active ml-2">
              v{STRATEGY_CONFIG.version}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Core Info */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Configuração
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Timeframe</span>
                    <p className="font-semibold">15 minutos</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Ativo</span>
                    <p className="font-semibold">ETHUSDT</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Indicadores Principais</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['Didi Index', 'DMI (ADX)', 'EMA50', 'ATR', 'Fibonacci'].map(ind => (
                    <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Indicadores Avançados</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['RSI', 'MACD', 'OBV', 'Volume Profile', 'VROC'].map(ind => (
                    <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Gestão de Risco */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-warning" />
                  Gestão de Risco (ATR Fixo)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-danger/10 border border-danger/20">
                    <span>Stop Loss</span>
                    <span className="font-semibold">1.35 × ATR</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-success/10 border border-success/20">
                    <span>Take Profit</span>
                    <span className="font-semibold">2.75 × ATR</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <span>Risco/Trade</span>
                    <span className="font-semibold">≤ 0.5%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Recursos Implementados
                </h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Indicador visual de força do sinal
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Sistema de notificações em tempo real
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Painel de personalização de parâmetros
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Backtest com Monte Carlo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default EstrategiaETH;
