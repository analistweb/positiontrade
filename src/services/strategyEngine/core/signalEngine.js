/**
 * STRATEGY ENGINE - MOTOR CENTRAL DETERMINÍSTICO
 * Funções puras que processam dados e config, retornam sinais
 * Mesmos inputs → mesmos outputs
 */

import {
  calculateEMA,
  calculateATR,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateOBV,
  calculateVROC,
  calculateDidiIndex,
  detectSwings,
  calculateSlope,
  checkEMAAlignment,
  calculateCandleStrength,
  detectOBVDivergence
} from './indicators';

import {
  detectMarketRegime,
  scoreLevel1,
  scoreLevel2,
  scoreLevel3,
  calculateTotalScore,
  applyStrongRallyAdjustments
} from './scoring';

import {
  validateBreakout,
  calculateBreakoutStrength,
  findReferenceCandle
} from './breakout';

import {
  calculateRiskLevels,
  calculateAdaptiveFibonacci
} from './riskManagement';

import { getConfigForAsset } from '@/config/strategyConfig';

/**
 * Gera hash determinístico do input para reprodutibilidade
 */
const generateInputHash = (data, config) => {
  const key = JSON.stringify({
    lastPrice: data[data.length - 1]?.close,
    lastTimestamp: data[data.length - 1]?.timestamp,
    configVersion: config.version
  });
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

/**
 * Prepara todos os indicadores necessários
 */
export const prepareIndicators = (data, config) => {
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume);
  
  // Indicadores básicos
  const ema9 = calculateEMA(closes, config.trend.ema.fast);
  const ema21 = calculateEMA(closes, config.trend.ema.medium);
  const ema50 = calculateEMA(closes, config.trend.ema.slow);
  const atr = calculateATR(highs, lows, closes, 14);
  const rsi = calculateRSI(closes, config.rsi.period);
  const macd = calculateMACD(closes, config.macd.fast, config.macd.slow, config.macd.signal);
  const adxData = calculateADX(highs, lows, closes, config.adx.period);
  const obv = calculateOBV(closes, volumes);
  const vroc = calculateVROC(volumes, 14);
  const didi = calculateDidiIndex(closes);
  
  // Swings
  const swings = detectSwings(
    highs, 
    lows, 
    config.fibonacci.pivotLookback.major,
    config.fibonacci.pivotLookback.minor
  );
  
  // Valores atuais
  const currentIdx = closes.length - 1;
  const currentClose = closes[currentIdx];
  const currentHigh = highs[currentIdx];
  const currentLow = lows[currentIdx];
  const currentVolume = volumes[currentIdx];
  
  // Médias
  const volumeAvg = volumes.slice(-config.volume.avgPeriod).reduce((a, b) => a + b, 0) / config.volume.avgPeriod;
  const atrCurrent = atr.length > 0 ? atr[atr.length - 1] : 0;
  
  // ADX atual
  const adxCurrent = adxData.length > 0 ? adxData[adxData.length - 1] : { adx: 0, plusDI: 0, minusDI: 0 };
  
  // RSI atual
  const rsiCurrent = rsi.length > 0 ? rsi[rsi.length - 1] : 50;
  
  // MACD atual
  const macdCurrent = {
    macd: macd.macd.length > 0 ? macd.macd[macd.macd.length - 1] : 0,
    signal: macd.signal.length > 0 ? macd.signal[macd.signal.length - 1] : 0,
    histogram: macd.histogram.length > 0 ? macd.histogram[macd.histogram.length - 1] : 0,
    histogramPrev: macd.histogram.length > 1 ? macd.histogram[macd.histogram.length - 2] : 0
  };
  
  // OBV
  const obvCurrent = obv.length > 0 ? obv[obv.length - 1] : 0;
  const obvPrev5 = obv.length >= 5 ? obv[obv.length - 5] : obvCurrent;
  const obvDivergence = detectOBVDivergence(closes, obv, 10);
  
  // Didi atual
  const didiCurrent = {
    short: didi.short.length > 0 ? didi.short[didi.short.length - 1] : 0,
    medium: didi.medium.length > 0 ? didi.medium[didi.medium.length - 1] : 0,
    long: didi.long.length > 0 ? didi.long[didi.long.length - 1] : 0
  };
  
  // VROC atual
  const vrocCurrent = vroc.length > 0 ? vroc[vroc.length - 1] : 0;
  
  // EMA slopes
  const ema50Slope = calculateSlope(ema50, config.trend.slopeMinPeriods);
  
  return {
    raw: { closes, highs, lows, volumes },
    emas: { ema9, ema21, ema50 },
    atr: { series: atr, current: atrCurrent },
    rsi: { series: rsi, current: rsiCurrent },
    macd: macdCurrent,
    adx: adxCurrent,
    obv: { series: obv, current: obvCurrent, previous5: obvPrev5, divergence: obvDivergence },
    vroc: { series: vroc, current: vrocCurrent },
    didi: didiCurrent,
    swings,
    volume: { current: currentVolume, avg: volumeAvg, ratio: currentVolume / volumeAvg },
    price: { current: currentClose, high: currentHigh, low: currentLow },
    slopes: { ema50: ema50Slope },
    candle: data[currentIdx]
  };
};

/**
 * Avalia condições para uma direção específica
 */
export const evaluateDirection = (direction, indicators, referenceCandle, config) => {
  const { price, atr, emas, adx, macd, rsi, obv, didi, volume, swings, slopes, candle } = indicators;
  
  // 1. Verificar breakout
  const breakout = validateBreakout(
    candle,
    referenceCandle,
    atr.current,
    direction,
    config.breakout
  );
  
  if (!breakout.isValid && breakout.category !== 'weak') {
    return {
      valid: false,
      reason: breakout.reason,
      breakout
    };
  }
  
  // 2. Verificar alinhamento de tendência
  const trendAlignment = checkEMAAlignment(emas.ema9, emas.ema21, emas.ema50, direction);
  trendAlignment.slope = slopes.ema50;
  
  // 3. Verificar força do candle
  const candleStrengthResult = calculateCandleStrength(candle, atr.current, config.candleStrength);
  
  // 4. Preparar dados para scoring
  const level1Data = {
    breakout: { 
      distance: breakout.distance, 
      atrMultiple: breakout.atrMultiple,
      isValid: breakout.isValid 
    },
    trendAlignment,
    candleStrength: candleStrengthResult,
    atr: atr.current
  };
  
  const level2Data = {
    volume: volume.current,
    volumeAvg: volume.avg,
    obv: {
      current: obv.current,
      previous5: obv.previous5,
      divergence: obv.divergence.bearish || obv.divergence.bullish
    },
    macd: {
      histogram: macd.histogram,
      histogramPrev: macd.histogramPrev,
      crossing: macd.macd > macd.signal ? 'bullish' : 'bearish'
    },
    didi: didi,
    atr: atr.current
  };
  
  const level3Data = {
    rsi: rsi.current,
    adx: adx.adx,
    vroc: indicators.vroc.current
  };
  
  // 5. Detectar regime de mercado
  const priceChange4h = indicators.raw ? 
    ((price.current - indicators.raw.closes[Math.max(0, indicators.raw.closes.length - 16)]) / 
     indicators.raw.closes[Math.max(0, indicators.raw.closes.length - 16)]) : 0;
  
  const regime = detectMarketRegime({
    adx: adx.adx,
    priceChange4h,
    volumeRatio: volume.ratio
  }, config);
  
  // 6. Calcular scores por nível
  const scoreL1 = scoreLevel1(level1Data, direction, config);
  const scoreL2 = scoreLevel2(level2Data, direction, config);
  const scoreL3 = scoreLevel3(level3Data, direction, regime, config);
  
  // 7. Score total
  let totalScoring = calculateTotalScore(scoreL1, scoreL2, scoreL3, regime, config);
  
  // 8. Aplicar ajustes de modo alta forte
  totalScoring = applyStrongRallyAdjustments(totalScoring, config);
  
  // 9. Calcular níveis de risco
  const riskLevels = calculateRiskLevels(
    price.current,
    atr.current,
    adx.adx,
    swings,
    direction,
    config
  );
  
  return {
    valid: totalScoring.allowEntry && riskLevels.isValid,
    direction,
    scoring: totalScoring,
    breakout,
    riskLevels,
    regime,
    indicators: {
      rsi: rsi.current,
      adx: adx.adx,
      macdHistogram: macd.histogram,
      volumeRatio: volume.ratio,
      obvTrend: obv.current > obv.previous5 ? 'up' : 'down',
      ema50Slope: slopes.ema50
    }
  };
};

/**
 * Função principal do engine - calcula sinal
 * FUNÇÃO PURA: mesmos inputs → mesmos outputs
 */
export const calculateSignal = (data, symbol, customConfig = {}) => {
  // 1. Obter configuração para o ativo
  const config = getConfigForAsset(symbol, customConfig);
  
  // 2. Validar dados mínimos
  if (!data || data.length < 100) {
    return {
      hasSignal: false,
      reason: 'Dados insuficientes',
      minRequired: 100,
      received: data?.length || 0
    };
  }
  
  // 3. Preparar indicadores
  const indicators = prepareIndicators(data, config);
  
  // 4. Encontrar candle de referência
  const referenceResult = findReferenceCandle(data, 5);
  if (!referenceResult) {
    return {
      hasSignal: false,
      reason: 'Não foi possível determinar candle de referência'
    };
  }
  
  const referenceCandle = referenceResult.candle;
  
  // 5. Avaliar direção de COMPRA
  const buyEval = evaluateDirection('buy', indicators, referenceCandle, config);
  
  // 6. Avaliar direção de VENDA
  const sellEval = evaluateDirection('sell', indicators, referenceCandle, config);
  
  // 7. Determinar melhor sinal
  let bestSignal = null;
  
  if (buyEval.valid && sellEval.valid) {
    // Ambos válidos - escolher o com maior score
    bestSignal = buyEval.scoring.percentage >= sellEval.scoring.percentage ? buyEval : sellEval;
  } else if (buyEval.valid) {
    bestSignal = buyEval;
  } else if (sellEval.valid) {
    bestSignal = sellEval;
  }
  
  // 8. Gerar resultado
  const inputHash = config.diagnostics.includeInputHash ? 
    generateInputHash(data, config) : null;
  
  if (!bestSignal) {
    return {
      hasSignal: false,
      reason: 'Nenhuma condição de entrada atendida',
      timestamp: new Date().toISOString(),
      inputHash,
      evaluations: {
        buy: { valid: buyEval.valid, score: buyEval.scoring?.percentage, reason: buyEval.reason },
        sell: { valid: sellEval.valid, score: sellEval.scoring?.percentage, reason: sellEval.reason }
      },
      indicators: indicators.price ? {
        price: indicators.price.current,
        atr: indicators.atr.current,
        adx: indicators.adx.adx,
        rsi: indicators.rsi.current,
        volumeRatio: indicators.volume.ratio
      } : null,
      configVersion: config.version
    };
  }
  
  // 9. Construir sinal completo
  return {
    hasSignal: true,
    signal: {
      type: bestSignal.direction === 'buy' ? 'COMPRA' : 'VENDA',
      direction: bestSignal.direction,
      symbol,
      entryPrice: indicators.price.current,
      takeProfit: bestSignal.riskLevels.tp,
      stopLoss: bestSignal.riskLevels.sl,
      riskReward: bestSignal.riskLevels.riskReward,
      timestamp: new Date().toISOString(),
      strength: bestSignal.scoring.percentage,
      category: bestSignal.scoring.category,
      regime: bestSignal.regime
    },
    scoring: bestSignal.scoring,
    breakout: bestSignal.breakout,
    riskLevels: bestSignal.riskLevels,
    indicators: bestSignal.indicators,
    diagnostics: config.diagnostics.includeFullMetrics ? {
      inputHash,
      configVersion: config.version,
      referenceCandle: {
        high: referenceCandle.high,
        low: referenceCandle.low,
        close: referenceCandle.close
      },
      swings: indicators.swings,
      evaluations: {
        buy: { valid: buyEval.valid, score: buyEval.scoring?.percentage },
        sell: { valid: sellEval.valid, score: sellEval.scoring?.percentage }
      }
    } : null
  };
};

/**
 * Verifica condições de saída para operação ativa
 */
export const checkExitConditions = (operation, currentData, config) => {
  if (!operation || !currentData || currentData.length === 0) {
    return { shouldExit: false };
  }
  
  const currentCandle = currentData[currentData.length - 1];
  const currentPrice = currentCandle.close;
  
  const { type, takeProfit, stopLoss, entryPrice } = operation;
  
  // Verificar TP/SL
  let hitTP = false;
  let hitSL = false;
  
  if (type === 'COMPRA') {
    hitTP = currentPrice >= takeProfit;
    hitSL = currentPrice <= stopLoss;
  } else {
    hitTP = currentPrice <= takeProfit;
    hitSL = currentPrice >= stopLoss;
  }
  
  if (hitTP) {
    const profit = type === 'COMPRA'
      ? ((takeProfit - entryPrice) / entryPrice) * 100
      : ((entryPrice - takeProfit) / entryPrice) * 100;
    
    return {
      shouldExit: true,
      reason: 'tp',
      profit: Math.round(profit * 100) / 100,
      exitPrice: currentPrice
    };
  }
  
  if (hitSL) {
    const loss = type === 'COMPRA'
      ? ((stopLoss - entryPrice) / entryPrice) * 100
      : ((entryPrice - stopLoss) / entryPrice) * 100;
    
    return {
      shouldExit: true,
      reason: 'sl',
      profit: Math.round(loss * 100) / 100,
      exitPrice: currentPrice
    };
  }
  
  return {
    shouldExit: false,
    currentPrice,
    progress: calculateProgress(operation, currentPrice)
  };
};

/**
 * Calcula progresso da operação
 */
const calculateProgress = (operation, currentPrice) => {
  const { type, takeProfit, stopLoss, entryPrice } = operation;
  
  const totalDistance = Math.abs(takeProfit - entryPrice);
  const currentDistance = type === 'COMPRA'
    ? currentPrice - entryPrice
    : entryPrice - currentPrice;
  
  return {
    percentage: Math.round((currentDistance / totalDistance) * 100),
    inProfit: currentDistance > 0
  };
};

export default {
  prepareIndicators,
  evaluateDirection,
  calculateSignal,
  checkExitConditions
};
