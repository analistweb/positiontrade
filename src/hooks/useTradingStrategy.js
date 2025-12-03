import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchKlineData, SUPPORTED_PAIRS } from '@/services/tradingService';
import { 
  calculateDidiIndex, 
  calculateDMI, 
  calculateEMA, 
  calculateATR,
  findPivotHigh,
  findPivotLow,
  validateRiskReward,
  detectSwing,
  calculateAdaptiveTPSL
} from '@/utils/technicalIndicators';
import {
  calculateOBV,
  calculateRSI,
  calculateMACD,
  calculateBreakoutStrength,
  calculateMarketStrength
} from '@/utils/advancedIndicators';

/**
 * Hook genérico para estratégia de trading
 * @param {string} symbol - Par de trading (ex: 'BTCUSDT')
 * @param {object} options - Opções de configuração
 */
export const useTradingStrategy = (symbol, options = {}) => {
  const {
    interval = '15m',
    candleLimit = 100,
    refetchInterval = 5000,
    parameters = {
      scoreThreshold: 70,
      minRR: 1.0,
      adxMin: 27,
      rsiOverbought: 70,
      rsiOversold: 30
    }
  } = options;

  const [lastSignal, setLastSignal] = useState(null);
  const [conditionsStatus, setConditionsStatus] = useState(null);
  const [activeOperation, setActiveOperation] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const [signalStatus, setSignalStatus] = useState('wait'); // 'buy', 'sell', 'wait'
  
  const pairConfig = SUPPORTED_PAIRS[symbol] || {
    symbol,
    name: symbol,
    shortName: symbol.replace('USDT', ''),
    icon: '●',
    color: 'hsl(var(--primary))',
    decimals: 2
  };

  // Query para dados de mercado
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['kline', symbol, interval],
    queryFn: () => fetchKlineData(symbol, interval, candleLimit),
    refetchInterval,
    staleTime: refetchInterval - 1000,
  });

  // Análise da estratégia
  const analyzeStrategy = useCallback((data) => {
    if (!data || data.length < 100) return null;
    if (activeOperation) return null;

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const opens = data.map(d => d.open);
    const volumes = data.map(d => d.volume);

    // Detectar pivôs
    const pivotHighs = findPivotHigh(highs, 5, 2);
    const pivotLows = findPivotLow(lows, 5, 2);

    // Candle de referência (menor corpo)
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

    // Indicadores técnicos
    const didiIndex = calculateDidiIndex(closes);
    const dmi = calculateDMI(highs, lows, closes);
    const atr = calculateATR(highs, lows, closes, 14);
    const ema50 = calculateEMA(closes, 50);
    const obv = calculateOBV(closes, volumes);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);

    // Verificar rompimento
    const breakoutThreshold = 0.0005;
    const buyBreakout = triggerCandle.close > referenceCandle.high * (1 + breakoutThreshold);
    const sellBreakout = triggerCandle.close < referenceCandle.low * (1 - breakoutThreshold);

    // Validações Didi Index
    const didiConfirmBuy = didiIndex.short[didiIndex.short.length - 1] > didiIndex.medium[didiIndex.medium.length - 1] &&
                          didiIndex.short[didiIndex.short.length - 1] > didiIndex.long[didiIndex.long.length - 1];
    
    const didiConfirmSell = didiIndex.short[didiIndex.short.length - 1] < didiIndex.medium[didiIndex.medium.length - 1] &&
                            didiIndex.short[didiIndex.short.length - 1] < didiIndex.long[didiIndex.long.length - 1];

    // Validações DMI
    const currentDMI = dmi[dmi.length - 1];
    const prevDMI = dmi[dmi.length - 2];
    const dmiConfirmBuy = currentDMI.plusDI > currentDMI.minusDI && 
                          currentDMI.adx > parameters.adxMin && 
                          currentDMI.adx > prevDMI.adx;
    
    const dmiConfirmSell = currentDMI.minusDI > currentDMI.plusDI && 
                           currentDMI.adx > parameters.adxMin && 
                           currentDMI.adx > prevDMI.adx;

    // Tendência EMA50
    const currentPrice = triggerCandle.close;
    const ema50Confirm = ema50[ema50.length - 1];
    const trendUp = currentPrice > ema50Confirm;
    const trendDown = currentPrice < ema50Confirm;

    // Filtros
    const avgATR = atr.slice(-100).reduce((a, b) => a + b, 0) / 100;
    const volatilityOk = atr[atr.length - 1] >= avgATR * 0.5;
    
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volumeOk = triggerCandle.volume >= avgVolume;

    // RSI
    const currentRSI = rsi[rsi.length - 1];
    const rsiOkForBuy = currentRSI >= 40 && currentRSI <= parameters.rsiOverbought;
    const rsiOkForSell = currentRSI >= parameters.rsiOversold && currentRSI <= 60;

    // MACD
    const currentMACD = macd.histogram[macd.histogram.length - 1];
    const prevMACD = macd.histogram[macd.histogram.length - 2];
    const macdBullish = currentMACD > 0 && currentMACD > prevMACD;
    const macdBearish = currentMACD < 0 && currentMACD < prevMACD;

    // OBV Trend
    const obvTrend = obv[obv.length - 1] > obv[obv.length - 5] ? 'up' : 'down';

    // Market Strength Score
    const marketStrengthScore = calculateMarketStrength({
      rsi: currentRSI,
      macdHistogram: currentMACD,
      macdHistogramPrev: prevMACD,
      volumeRatio: triggerCandle.volume / avgVolume,
      obvTrend
    });

    // Swing Detection + Fibonacci Adaptativo
    const swings = detectSwing(highs, lows, 20, 5);
    const { swingHigh, swingLow } = swings;

    let calculatedTP = null;
    let calculatedSL = null;
    let rrValidation = null;
    let direction = null;
    let fibUsed = null;
    
    const adxStrength = currentDMI.adx;
    
    if (buyBreakout && swingHigh && swingLow) {
      direction = 'buy';
      const result = calculateAdaptiveTPSL(currentPrice, swingHigh, swingLow, adxStrength, direction);
      calculatedTP = result.tp;
      calculatedSL = result.sl;
      fibUsed = result.fibUsed;
      
      if (calculatedTP && calculatedSL) {
        rrValidation = validateRiskReward(currentPrice, calculatedTP, calculatedSL, parameters.minRR);
      }
    } else if (sellBreakout && swingHigh && swingLow) {
      direction = 'sell';
      const result = calculateAdaptiveTPSL(currentPrice, swingHigh, swingLow, adxStrength, direction);
      calculatedTP = result.tp;
      calculatedSL = result.sl;
      fibUsed = result.fibUsed;
      
      if (calculatedTP && calculatedSL) {
        rrValidation = validateRiskReward(currentPrice, calculatedTP, calculatedSL, parameters.minRR);
      }
    }

    // Construir status das condições
    const conditions = {
      breakout: { buy: buyBreakout, sell: sellBreakout },
      didi: { buy: didiConfirmBuy, sell: didiConfirmSell },
      dmi: { 
        buy: dmiConfirmBuy, 
        sell: dmiConfirmSell, 
        adx: currentDMI.adx,
        plusDI: currentDMI.plusDI,
        minusDI: currentDMI.minusDI
      },
      trend: { up: trendUp, down: trendDown, ema50: ema50Confirm },
      filters: { volatility: volatilityOk, volume: volumeOk },
      rsi: { value: currentRSI, buyOk: rsiOkForBuy, sellOk: rsiOkForSell },
      macd: { bullish: macdBullish, bearish: macdBearish, histogram: currentMACD },
      marketStrength: marketStrengthScore,
      fibonacci: { tp: calculatedTP, sl: calculatedSL, fibUsed, rrValidation },
      currentPrice,
      referenceCandle
    };

    setConditionsStatus(conditions);

    // Verificar sinal de COMPRA
    const buyConditionsMet = buyBreakout && didiConfirmBuy && dmiConfirmBuy && trendUp && 
                            volatilityOk && volumeOk && rsiOkForBuy && 
                            marketStrengthScore >= parameters.scoreThreshold &&
                            calculatedTP && calculatedSL && rrValidation?.valid;

    // Verificar sinal de VENDA
    const sellConditionsMet = sellBreakout && didiConfirmSell && dmiConfirmSell && trendDown && 
                             volatilityOk && volumeOk && rsiOkForSell && 
                             marketStrengthScore >= parameters.scoreThreshold &&
                             calculatedTP && calculatedSL && rrValidation?.valid;

    if (buyConditionsMet) {
      const signal = {
        type: 'COMPRA',
        symbol,
        entryPrice: currentPrice,
        takeProfit: calculatedTP,
        stopLoss: calculatedSL,
        timestamp: new Date().toLocaleString('pt-BR'),
        strength: marketStrengthScore,
        rr: rrValidation.ratio,
        conditions
      };
      
      setLastSignal(signal);
      setSignalStatus('buy');
      setActiveOperation(signal);
      setSignalHistory(prev => [signal, ...prev].slice(0, 50));
      
      return signal;
    }

    if (sellConditionsMet) {
      const signal = {
        type: 'VENDA',
        symbol,
        entryPrice: currentPrice,
        takeProfit: calculatedTP,
        stopLoss: calculatedSL,
        timestamp: new Date().toLocaleString('pt-BR'),
        strength: marketStrengthScore,
        rr: rrValidation.ratio,
        conditions
      };
      
      setLastSignal(signal);
      setSignalStatus('sell');
      setActiveOperation(signal);
      setSignalHistory(prev => [signal, ...prev].slice(0, 50));
      
      return signal;
    }

    setSignalStatus('wait');
    return null;
  }, [symbol, parameters, activeOperation]);

  // Verificar TP/SL da operação ativa
  const checkActiveOperation = useCallback((data) => {
    if (!activeOperation || !data || data.length === 0) return;

    const currentPrice = data[data.length - 1].close;
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

      const closedSignal = {
        ...activeOperation,
        closedAt: new Date().toLocaleString('pt-BR'),
        profit: profitPercent,
        status: 'SUCESSO'
      };

      setSignalHistory(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(s => s.timestamp === activeOperation.timestamp);
        if (idx >= 0) updated[idx] = closedSignal;
        return updated;
      });
      
      setActiveOperation(null);
      setSignalStatus('wait');
      
      toast.success(`${pairConfig.shortName}: Take Profit atingido! +${profitPercent}%`);
      return { type: 'tp', signal: closedSignal };
    }

    if (hitSL) {
      const lossPercent = activeOperation.type === 'COMPRA' 
        ? ((activeOperation.stopLoss - activeOperation.entryPrice) / activeOperation.entryPrice * 100).toFixed(2)
        : ((activeOperation.entryPrice - activeOperation.stopLoss) / activeOperation.entryPrice * 100).toFixed(2);

      const closedSignal = {
        ...activeOperation,
        closedAt: new Date().toLocaleString('pt-BR'),
        profit: lossPercent,
        status: 'STOP LOSS'
      };

      setSignalHistory(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(s => s.timestamp === activeOperation.timestamp);
        if (idx >= 0) updated[idx] = closedSignal;
        return updated;
      });
      
      setActiveOperation(null);
      setSignalStatus('wait');
      
      toast.error(`${pairConfig.shortName}: Stop Loss atingido. ${lossPercent}%`);
      return { type: 'sl', signal: closedSignal };
    }

    return null;
  }, [activeOperation, pairConfig]);

  // Efeito para análise quando dados mudam
  useEffect(() => {
    if (marketData && marketData.length > 0) {
      checkActiveOperation(marketData);
      analyzeStrategy(marketData);
    }
  }, [marketData, analyzeStrategy, checkActiveOperation]);

  // Função para cancelar operação manualmente
  const cancelOperation = useCallback(() => {
    if (activeOperation) {
      setActiveOperation(null);
      setSignalStatus('wait');
      toast.info(`${pairConfig.shortName}: Operação cancelada manualmente`);
    }
  }, [activeOperation, pairConfig]);

  return {
    // Data
    marketData,
    isLoading,
    error,
    pairConfig,
    
    // Signal State
    lastSignal,
    signalStatus,
    conditionsStatus,
    activeOperation,
    signalHistory,
    
    // Actions
    refetch,
    cancelOperation,
    
    // Current Price
    currentPrice: marketData?.[marketData.length - 1]?.close || 0
  };
};

export default useTradingStrategy;
