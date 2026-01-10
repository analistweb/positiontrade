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
      // Preparar indicadores (usados para UI/diagnóstico)
      const indicators = prepareIndicators(data, STRATEGY_CONFIG);

      // Detectar regime de mercado (mesma heurística em todas as páginas)
      // Mudança de preço das últimas 4 horas (16 candles de 15min)
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

      // Calcular sinal no engine determinístico
      const engineResult = calculateSignal(data, symbol, {
        ...STRATEGY_CONFIG,
        parameters
      });

      // ===== Mapear resultado do engine para o UI =====
      const adxValue = indicators.adx?.adx ?? indicators.adx ?? 0;
      const plusDI = indicators.adx?.plusDI ?? 0;
      const minusDI = indicators.adx?.minusDI ?? 0;
      const rsiValue = engineResult?.indicators?.rsi ?? indicators.rsi?.current ?? indicators.rsi ?? 50;
      const macdHistogram = engineResult?.indicators?.macdHistogram ?? indicators.macd?.histogram ?? 0;
      const ema50Value = indicators.emas?.ema50?.[indicators.emas.ema50.length - 1] ?? 0;
      const engineScore = engineResult?.scoring?.percentage ?? engineResult?.signal?.strength ?? 0;
      const direction = engineResult?.signal?.direction;

      // Confluence (se não houver cálculo explícito no engine, manter em 0)
      setConfluenceScores({ trend: 0, volume: 0, momentum: 0 });

      setConditionsStatus({
        breakout: engineResult?.breakout,
        didi: indicators.didi,
        dmi: {
          buy: direction === 'buy',
          sell: direction === 'sell',
          adx: adxValue,
          plusDI,
          minusDI
        },
        trend: {
          up: direction === 'buy',
          down: direction === 'sell',
          ema50: ema50Value
        },
        filters: {
          // Mantemos esses campos para o card não quebrar; a validação real é do engine.
          volatility: true,
          volume: (engineResult?.indicators?.volumeRatio ?? indicators.volume?.ratio ?? 0) >= 1
        },
        rsi: {
          value: rsiValue,
          buyOk: true,
          sellOk: true
        },
        macd: {
          bullish: macdHistogram > 0,
          bearish: macdHistogram < 0,
          histogram: macdHistogram
        },
        adx: adxValue,
        currentVolume: indicators.volume?.current ?? 0,
        avgVolume: indicators.volume?.avg ?? 1,
        marketStrength: engineScore,
        currentPrice: data[data.length - 1].close,
        referenceCandle: engineResult?.diagnostics?.referenceCandle
      });

      setDiagnosticData({
        scoreBreakdown: engineResult?.scoring?.breakdown,
        indicators: {
          breakoutValid: engineResult?.breakout?.isValid,
          volumeConfirm: (engineResult?.indicators?.volumeRatio ?? indicators.volume?.ratio ?? 0) >= 1,
          rsi: rsiValue,
          adx: adxValue,
          vroc: indicators.vroc?.current ?? 0,
          volumeRatio: engineResult?.indicators?.volumeRatio ?? indicators.volume?.ratio ?? 1
        },
        regime: engineResult?.signal?.regime ?? regime,
        configVersion: engineResult?.configVersion ?? STRATEGY_CONFIG.version
      });

      // ===== Se o engine aprovou, emitir sinal =====
      if (engineResult?.hasSignal && engineResult?.signal) {
        const engineSignal = engineResult.signal;

        const signal = {
          id: `SIG-${Date.now().toString(36).toUpperCase()}`,
          type: engineSignal.type,
          symbol: engineSignal.symbol || symbol,
          entryPrice: engineSignal.entryPrice,
          takeProfit: engineSignal.takeProfit,
          stopLoss: engineSignal.stopLoss,
          timestamp: new Date().toLocaleString('pt-BR'),
          strength: engineSignal.strength ?? engineScore,
          rr: engineSignal.riskReward,
          category: engineSignal.category,
          regime: engineSignal.regime,
          conditions: engineResult
        };

        logger.signal(signal.type, {
          symbol,
          entry: signal.entryPrice,
          tp: signal.takeProfit,
          sl: signal.stopLoss,
          score: signal.strength,
          regime: signal.regime
        });

        setLastSignal(signal);
        setSignalStatus(engineSignal.direction);
        setActiveOperation(signal);
        setSignalHistory(prev => [signal, ...prev].slice(0, 50));

        const latency = performance.now() - startTime;
        logger.latency('analyzeStrategy', latency);

        return signal;
      }

      // Log de rejeição (quando houver breakout válido mas não aprovar)
      if (engineResult?.breakout?.isValid && !engineResult?.hasSignal) {
        logger.rejection(engineResult?.reason || 'Sinal não aprovado pelo engine', {
          score: engineScore,
          regime
        });
      }

      setSignalStatus('wait');

      const latency = performance.now() - startTime;
      logger.latency('analyzeStrategy', latency);

      return null;
    } catch (err) {
      setSignalStatus('wait');
      logger.error('useTradingStrategy', 'Erro na análise', { error: err?.message || String(err), symbol });
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
      try {
        // Assinatura: (operation, currentPrice, previousCandle, obvAcceleration, config)
        const breakEvenResult = calculateDynamicBreakEven(
          activeOperation,
          currentPrice,
          previousCandle,
          0, // OBV acceleration - simplificado
          STRATEGY_CONFIG
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
      } catch (e) {
        logger.error('useTradingStrategy', 'Erro no break-even dinâmico', {
          error: e?.message || String(e),
          symbol
        });
      }
    }

    return null;
  }, [activeOperation, pairConfig, symbol]);

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
