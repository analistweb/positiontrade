/**
 * MÓDULO DE INDICADORES - FUNÇÕES PURAS DETERMINÍSTICAS
 * Todas as funções recebem dados e config, retornam resultado tipado
 * Sem side effects, sem estado interno
 */

import { getConfigForAsset } from '@/config/strategyConfig';

/**
 * Normaliza valor por ATR para comparação cross-asset
 * @param {number} value - Valor a normalizar
 * @param {number} atr - ATR atual
 * @returns {number} - Valor normalizado
 */
export const normalizeByATR = (value, atr) => {
  if (!atr || atr === 0) return 0;
  return value / atr;
};

/**
 * Calcula Z-Score para normalização estatística
 * @param {number} value - Valor atual
 * @param {Array} series - Série histórica
 * @param {number} period - Período para média/desvio
 * @returns {number} - Z-Score
 */
export const calculateZScore = (value, series, period = 20) => {
  if (!series || series.length < period) return 0;
  
  const subset = series.slice(-period);
  const mean = subset.reduce((a, b) => a + b, 0) / period;
  const variance = subset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

/**
 * EMA (Exponential Moving Average) - Função pura
 */
export const calculateEMA = (closes, period) => {
  if (!closes || closes.length < period) return [];
  
  const k = 2 / (period + 1);
  const ema = [closes[0]];
  
  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  
  return ema;
};

/**
 * ATR (Average True Range) - Função pura
 */
export const calculateATR = (highs, lows, closes, period = 14) => {
  if (!highs || !lows || !closes || closes.length < period + 1) return [];
  
  const trueRanges = [];
  
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  
  const atr = [];
  for (let i = period - 1; i < trueRanges.length; i++) {
    const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    atr.push(sum / period);
  }
  
  return atr;
};

/**
 * RSI (Relative Strength Index) - Função pura
 */
export const calculateRSI = (closes, period = 14) => {
  if (!closes || closes.length < period + 1) return [];
  
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const rsi = [];
  let avgGain = 0;
  let avgLoss = 0;
  
  // Primeira média
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  
  rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  
  // Médias suavizadas
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  }
  
  return rsi;
};

/**
 * MACD - Função pura
 */
export const calculateMACD = (closes, fast = 12, slow = 26, signal = 9) => {
  if (!closes || closes.length < slow) {
    return { macd: [], signal: [], histogram: [] };
  }
  
  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);
  
  const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signal);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);
  
  return { macd: macdLine, signal: signalLine, histogram };
};

/**
 * ADX/DMI - Função pura
 */
export const calculateADX = (highs, lows, closes, period = 14) => {
  if (!highs || !lows || !closes || closes.length < period + 1) {
    return [];
  }
  
  const results = [];
  
  for (let i = period; i < closes.length; i++) {
    let plusDM = 0;
    let minusDM = 0;
    let tr = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      const highDiff = highs[j] - highs[j - 1];
      const lowDiff = lows[j - 1] - lows[j];
      
      if (highDiff > lowDiff && highDiff > 0) plusDM += highDiff;
      if (lowDiff > highDiff && lowDiff > 0) minusDM += lowDiff;
      
      const trueRange = Math.max(
        highs[j] - lows[j],
        Math.abs(highs[j] - closes[j - 1]),
        Math.abs(lows[j] - closes[j - 1])
      );
      tr += trueRange;
    }
    
    const plusDI = tr > 0 ? (plusDM / tr) * 100 : 0;
    const minusDI = tr > 0 ? (minusDM / tr) * 100 : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    
    const adx = results.length > 0
      ? (results[results.length - 1].adx * (period - 1) + dx) / period
      : dx;
    
    results.push({ plusDI, minusDI, adx, dx });
  }
  
  return results;
};

/**
 * OBV (On-Balance Volume) - Função pura
 */
export const calculateOBV = (closes, volumes) => {
  if (!closes || !volumes || closes.length !== volumes.length) return [];
  
  const obv = [volumes[0]];
  
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv.push(obv[obv.length - 1] + volumes[i]);
    } else if (closes[i] < closes[i - 1]) {
      obv.push(obv[obv.length - 1] - volumes[i]);
    } else {
      obv.push(obv[obv.length - 1]);
    }
  }
  
  return obv;
};

/**
 * VROC (Volume Rate of Change) - Função pura
 */
export const calculateVROC = (volumes, period = 14) => {
  if (!volumes || volumes.length < period + 1) return [];
  
  const vroc = [];
  for (let i = period; i < volumes.length; i++) {
    const pastVol = volumes[i - period];
    const change = pastVol > 0 ? ((volumes[i] - pastVol) / pastVol) * 100 : 0;
    vroc.push(change);
  }
  
  return vroc;
};

/**
 * Didi Index - Função pura
 */
export const calculateDidiIndex = (closes, short = 3, medium = 8, long = 20) => {
  const sma = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  };
  
  return {
    short: sma(closes, short),
    medium: sma(closes, medium),
    long: sma(closes, long)
  };
};

/**
 * Detecta Swing High/Low com lookback fixo (sem repaint)
 */
export const detectSwings = (highs, lows, lookbackMajor = 20, lookbackMinor = 5) => {
  const findSwingHigh = (data, lookback) => {
    const swings = [];
    // Não incluir últimas 'lookback' barras para evitar repaint
    for (let i = lookback; i < data.length - lookback; i++) {
      let isSwing = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j] >= data[i]) {
          isSwing = false;
          break;
        }
      }
      if (isSwing) {
        swings.push({ index: i, value: data[i], confirmed: true });
      }
    }
    return swings;
  };
  
  const findSwingLow = (data, lookback) => {
    const swings = [];
    for (let i = lookback; i < data.length - lookback; i++) {
      let isSwing = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j] <= data[i]) {
          isSwing = false;
          break;
        }
      }
      if (isSwing) {
        swings.push({ index: i, value: data[i], confirmed: true });
      }
    }
    return swings;
  };
  
  // Priorizar swings maiores
  const highsMajor = findSwingHigh(highs, lookbackMajor);
  const lowsMajor = findSwingLow(lows, lookbackMajor);
  const highsMinor = findSwingHigh(highs, lookbackMinor);
  const lowsMinor = findSwingLow(lows, lookbackMinor);
  
  return {
    swingHigh: highsMajor.length > 0 ? highsMajor[highsMajor.length - 1] :
               (highsMinor.length > 0 ? highsMinor[highsMinor.length - 1] : null),
    swingLow: lowsMajor.length > 0 ? lowsMajor[lowsMajor.length - 1] :
              (lowsMinor.length > 0 ? lowsMinor[lowsMinor.length - 1] : null),
    allHighs: { major: highsMajor, minor: highsMinor },
    allLows: { major: lowsMajor, minor: lowsMinor }
  };
};

/**
 * Calcula slope (inclinação) de uma série
 */
export const calculateSlope = (series, periods = 3) => {
  if (!series || series.length < periods) return 0;
  
  const recent = series.slice(-periods);
  const first = recent[0];
  const last = recent[recent.length - 1];
  
  if (first === 0) return 0;
  return (last - first) / first;
};

/**
 * Verifica se EMA está alinhada com direção
 */
export const checkEMAAlignment = (ema9, ema21, ema50, direction) => {
  const lastEma9 = ema9[ema9.length - 1];
  const lastEma21 = ema21[ema21.length - 1];
  const lastEma50 = ema50[ema50.length - 1];
  
  if (direction === 'buy') {
    const aligned = lastEma9 > lastEma21 && lastEma21 > lastEma50;
    const partial = lastEma9 > lastEma50;
    return { aligned, partial, emas: { ema9: lastEma9, ema21: lastEma21, ema50: lastEma50 } };
  } else {
    const aligned = lastEma9 < lastEma21 && lastEma21 < lastEma50;
    const partial = lastEma9 < lastEma50;
    return { aligned, partial, emas: { ema9: lastEma9, ema21: lastEma21, ema50: lastEma50 } };
  }
};

/**
 * Calcula força do candle
 */
export const calculateCandleStrength = (candle, atr, config) => {
  const { minBodyToATR, minTrueRangeToATR, closingPosition, maxWickAgainstRatio } = config;
  
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  const isBullish = candle.close > candle.open;
  
  // Body / ATR ratio
  const bodyToATR = body / atr;
  const bodyOk = bodyToATR >= minBodyToATR;
  
  // True Range / ATR ratio
  const trToATR = range / atr;
  const trOk = trToATR >= minTrueRangeToATR;
  
  // Posição do fechamento
  const closePosition = range > 0 ? (candle.close - candle.low) / range : 0.5;
  const positionOk = isBullish ? closePosition >= (1 - closingPosition) : closePosition <= closingPosition;
  
  // Wick contra
  const wickAgainst = isBullish
    ? (candle.high - candle.close) / body
    : (candle.open - candle.low) / body;
  const wickOk = wickAgainst <= maxWickAgainstRatio;
  
  const score = (bodyOk ? 25 : 0) + (trOk ? 25 : 0) + (positionOk ? 25 : 0) + (wickOk ? 25 : 0);
  
  return {
    score,
    bodyToATR,
    trToATR,
    closePosition,
    wickAgainst,
    checks: { bodyOk, trOk, positionOk, wickOk },
    isStrong: score >= 75
  };
};

/**
 * Detecta divergência OBV
 */
export const detectOBVDivergence = (prices, obv, lookback = 10) => {
  if (prices.length < lookback || obv.length < lookback) {
    return { bullish: false, bearish: false };
  }
  
  const recentPrices = prices.slice(-lookback);
  const recentOBV = obv.slice(-lookback);
  
  const priceSlope = calculateSlope(recentPrices, lookback);
  const obvSlope = calculateSlope(recentOBV, lookback);
  
  return {
    bullish: priceSlope < 0 && obvSlope > 0,
    bearish: priceSlope > 0 && obvSlope < 0,
    priceSlope,
    obvSlope
  };
};

export default {
  normalizeByATR,
  calculateZScore,
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
};
