import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchKlineData, SUPPORTED_PAIRS } from '@/services/tradingService';
import { calculateSignal, checkExitConditions, prepareIndicators } from '@/services/strategyEngine';
import { calculateRiskLevels, checkTPSL, calculateDynamicBreakEven } from '@/services/strategyEngine/core/riskManagement';
import { detectMarketRegime } from '@/services/strategyEngine/core/scoring';
import { defaultStrategyConfig as STRATEGY_CONFIG } from '@/config/strategyConfig';
import { logger } from '@/utils/logger';

/**
 * Hook genérico para estratégia de trading usando o novo Strategy Engine
 * @param {string} symbol - Par de trading (ex: 'BTCUSDT')
 * @param {object} options - Opções de configuração
 */
export const useTradingStrategy = (symbol, options = {}) => {
  const {
    interval = '15m',
    candleLimit = 100,
    refetchInterval = 5000,
    parameters = STRATEGY_CONFIG.scoring
  } = options;

  const [lastSignal, setLastSignal] = useState(null);
  const [conditionsStatus, setConditionsStatus] = useState(null);
  const [activeOperation, setActiveOperation] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const [signalStatus, setSignalStatus] = useState('wait');
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [confluenceScores, setConfluenceScores] = useState({ trend: 0, volume: 0, momentum: 0 });
  const [marketRegime, setMarketRegime] = useState('unknown');
  
  const lastUpdateRef = useRef(Date.now());
  
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

  // Análise da estratégia usando novo engine
  const analyzeStrategy = useCallback((data) => {
    if (!data || data.length < 50) return null;
    if (activeOperation) return null;

    const startTime = performance.now();
    
    try {
      // Preparar indicadores com configuração
      const indicators = prepareIndicators(data, STRATEGY_CONFIG);
      
      // Detectar regime de mercado
      // Calcula mudança de preço das últimas 4 horas (16 candles de 15min)
      const priceChange4h = data.length >= 16 
        ? (data[data.length - 1].close - data[data.length - 16].close) / data[data.length - 16].close 
        : 0;
      const volumeRatio = indicators.volume?.ratio || 1;
      
      const regimeIndicators = {
        adx: indicators.adx?.adx || indicators.adx || 0,
        priceChange4h,
        volumeRatio
      };
      
      const regime = detectMarketRegime(regimeIndicators, STRATEGY_CONFIG);
      setMarketRegime(regime);
      
      // Calcular sinal usando engine central
      const signalResult = calculateSignal(data, {
        ...STRATEGY_CONFIG,
        parameters
      });
      
      // Atualizar scores de confluência
      setConfluenceScores({
        trend: signalResult.scores?.trend || 0,
        volume: signalResult.scores?.volume || 0,
        momentum: signalResult.scores?.momentum || 0
      });
      
      // Atualizar status das condições
      const adxValue = indicators.adx?.adx ?? indicators.adx ?? 0;
      const plusDI = indicators.adx?.plusDI ?? 0;
      const minusDI = indicators.adx?.minusDI ?? 0;
      const rsiValue = indicators.rsi?.current ?? indicators.rsi ?? 50;
      const macdHistogram = indicators.macd?.histogram ?? 0;
      const ema50Value = indicators.emas?.ema50?.[indicators.emas.ema50.length - 1] ?? 0;
      
      setConditionsStatus({
        breakout: signalResult.breakout,
        didi: signalResult.indicators?.didi,
        dmi: {
          buy: signalResult.direction === 'buy',
          sell: signalResult.direction === 'sell',
          adx: adxValue,
          plusDI: plusDI,
          minusDI: minusDI
        },
        trend: { 
          up: signalResult.direction === 'buy', 
          down: signalResult.direction === 'sell', 
          ema50: ema50Value 
        },
        filters: { 
          volatility: signalResult.filters?.volatilityOk, 
          volume: signalResult.filters?.volumeOk 
        },
        rsi: { 
          value: rsiValue, 
          buyOk: signalResult.filters?.rsiOkForBuy, 
          sellOk: signalResult.filters?.rsiOkForSell 
        },
        macd: { 
          bullish: macdHistogram > 0, 
          bearish: macdHistogram < 0, 
          histogram: macdHistogram 
        },
        adx: adxValue,
        currentVolume: indicators.volume?.current ?? 0,
        avgVolume: indicators.volume?.avg ?? 1,
        marketStrength: signalResult.totalScore,
        fibonacci: signalResult.fibonacci,
        currentPrice: data[data.length - 1].close,
        referenceCandle: signalResult.referenceCandle,
        buy: {
          trend: signalResult.direction === 'buy' && signalResult.filters?.trendAligned,
          volume: signalResult.direction === 'buy' && signalResult.filters?.volumeOk,
          breakout: signalResult.direction === 'buy' && signalResult.breakout?.isValid,
          didi: signalResult.direction === 'buy' && signalResult.indicators?.didiConfirm,
          dmi: signalResult.direction === 'buy' && plusDI > minusDI,
          volatility: signalResult.filters?.volatilityOk,
          rsi: signalResult.filters?.rsiOkForBuy,
          macd: macdHistogram > 0,
          obv: signalResult.indicators?.obvAligned
        },
        sell: {
          trend: signalResult.direction === 'sell' && signalResult.filters?.trendAligned,
          volume: signalResult.direction === 'sell' && signalResult.filters?.volumeOk,
          breakout: signalResult.direction === 'sell' && signalResult.breakout?.isValid,
          didi: signalResult.direction === 'sell' && signalResult.indicators?.didiConfirm,
          dmi: signalResult.direction === 'sell' && minusDI > plusDI,
          volatility: signalResult.filters?.volatilityOk,
          rsi: signalResult.filters?.rsiOkForSell,
          macd: macdHistogram < 0,
          obv: signalResult.indicators?.obvAligned
        }
      });
      
      // Dados de diagnóstico
      setDiagnosticData({
        scoreBreakdown: signalResult.scoreBreakdown,
        indicators: {
          breakoutValid: signalResult.breakout?.isValid,
          trendAligned: signalResult.filters?.trendAligned,
          candleStrength: signalResult.filters?.candleStrengthOk,
          volumeConfirm: signalResult.filters?.volumeOk,
          obvAligned: signalResult.indicators?.obvAligned,
          macdConfirm: signalResult.indicators?.macdConfirm,
          didiConfirm: signalResult.indicators?.didiConfirm,
          rsi: rsiValue,
          adx: adxValue,
          vroc: indicators.vroc?.current ?? 0,
          volumeRatio: indicators.volume?.ratio ?? 1
        },
        regime,
        configVersion: STRATEGY_CONFIG.version
      });
      
      // Verificar se deve gerar sinal
      if (signalResult.shouldSignal && signalResult.direction) {
        const currentPrice = data[data.length - 1].close;
        
        // Calcular níveis de risco
        const atrValue = indicators.atr?.current ?? indicators.atr ?? 0;
        const riskLevels = calculateRiskLevels(
          currentPrice,
          signalResult.fibonacci?.swingHigh,
          signalResult.fibonacci?.swingLow,
          adxValue,
          atrValue,
          signalResult.direction
        );
        
        const signal = {
          id: `SIG-${Date.now().toString(36).toUpperCase()}`,
          type: signalResult.direction === 'buy' ? 'COMPRA' : 'VENDA',
          symbol,
          entryPrice: currentPrice,
          takeProfit: riskLevels.takeProfit,
          stopLoss: riskLevels.stopLoss,
          timestamp: new Date().toLocaleString('pt-BR'),
          strength: signalResult.totalScore,
          rr: riskLevels.riskRewardRatio,
          category: signalResult.category,
          regime,
          conditions: signalResult
        };
        
        // Log do sinal
        logger.signal(signal.type, {
          symbol,
          entry: currentPrice,
          tp: riskLevels.takeProfit,
          sl: riskLevels.stopLoss,
          score: signalResult.totalScore,
          regime
        });
        
        setLastSignal(signal);
        setSignalStatus(signalResult.direction);
        setActiveOperation(signal);
        setSignalHistory(prev => [signal, ...prev].slice(0, 50));
        
        // Log de latência
        const latency = performance.now() - startTime;
        logger.latency('analyzeStrategy', latency);
        
        return signal;
      }
      
      // Log de rejeição se houver breakout mas score insuficiente
      if (signalResult.breakout?.isValid && !signalResult.shouldSignal) {
        logger.rejection(signalResult.rejectionReason || 'Score insuficiente', {
          score: signalResult.totalScore,
          threshold: parameters.thresholds?.strong || 70,
          regime
        });
      }
      
      setSignalStatus('wait');
      
      // Log de latência
      const latency = performance.now() - startTime;
      logger.latency('analyzeStrategy', latency);
      
      return null;
    } catch (err) {
      logger.error('useTradingStrategy', 'Erro na análise', { error: err.message, symbol });
      return null;
    }
  }, [symbol, parameters, activeOperation]);

  // Verificar TP/SL da operação ativa
  const checkActiveOperation = useCallback((data) => {
    if (!activeOperation || !data || data.length === 0) return;

    const currentPrice = data[data.length - 1].close;
    const previousCandle = data.length >= 2 ? data[data.length - 2] : null;
    
    // Verificar TP/SL
    const result = checkTPSL(activeOperation, currentPrice);
    
    if (result.hit) {
      const closedSignal = {
        ...activeOperation,
        closedAt: new Date().toLocaleString('pt-BR'),
        profit: result.profit,
        status: result.type === 'tp' ? 'SUCESSO' : 'STOP LOSS'
      };

      setSignalHistory(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(s => s.timestamp === activeOperation.timestamp);
        if (idx >= 0) updated[idx] = closedSignal;
        return updated;
      });
      
      setActiveOperation(null);
      setSignalStatus('wait');
      
      if (result.type === 'tp') {
        toast.success(`${pairConfig.shortName}: Take Profit atingido! +${result.profit}%`);
        logger.info('TradeResult', 'TP atingido', { symbol, profit: result.profit });
      } else {
        toast.error(`${pairConfig.shortName}: Stop Loss atingido. ${result.profit}%`);
        logger.info('TradeResult', 'SL atingido', { symbol, loss: result.profit });
      }
      
      return { type: result.type, signal: closedSignal };
    }
    
    // Verificar break-even dinâmico
    if (previousCandle) {
      const breakEvenResult = calculateDynamicBreakEven(
        activeOperation,
        currentPrice,
        0, // OBV acceleration - simplificado
        previousCandle
      );
      
      if (breakEvenResult.breakEvenActivated && !activeOperation.breakEvenActivated) {
        setActiveOperation(prev => ({
          ...prev,
          stopLoss: breakEvenResult.newSL,
          breakEvenActivated: true
        }));
        
        toast.success('🔄 Break-even ativado!', {
          description: `Novo SL: ${breakEvenResult.newSL.toFixed(2)}`
        });
      }
    }

    return null;
  }, [activeOperation, pairConfig]);

  // Efeito para análise quando dados mudam
  useEffect(() => {
    if (marketData && marketData.length > 0) {
      lastUpdateRef.current = Date.now();
      checkActiveOperation(marketData);
      analyzeStrategy(marketData);
    }
  }, [marketData, analyzeStrategy, checkActiveOperation]);

  // Função para cancelar operação manualmente
  const cancelOperation = useCallback(() => {
    if (activeOperation) {
      logger.info('Trade', 'Operação cancelada manualmente', { symbol, signal: activeOperation.id });
      setActiveOperation(null);
      setSignalStatus('wait');
      toast.info(`${pairConfig.shortName}: Operação cancelada manualmente`);
    }
  }, [activeOperation, pairConfig, symbol]);

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
    
    // New Engine Data
    diagnosticData,
    confluenceScores,
    marketRegime,
    lastUpdate: lastUpdateRef.current,
    
    // Actions
    refetch,
    cancelOperation,
    
    // Current Price
    currentPrice: marketData?.[marketData.length - 1]?.close || 0
  };
};

export default useTradingStrategy;
