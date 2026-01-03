/**
 * SIGNAL ENGINE SIMPLIFICADO - v1.1+
 * Lógica de entrada: EMA50 + ADX + Volume + Pullback + Pivots
 * Remove: RSI, MACD, OBV, Score de mercado
 */

import {
  calculateEMA,
  calculateATR,
  calculateADX,
  calculateRSI,
  detectSwings,
  calculateSlope
} from './indicators';

import { getActiveConfig, STRATEGY_V1_1 } from '@/config/strategyConfig';

/**
 * Prepara indicadores para estratégia simplificada
 */
export const prepareSimplifiedIndicators = (data, config) => {
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume);
  
  const emaLength = config.entry?.emaLength || config.trend?.ema?.slow || 50;
  const ema50 = calculateEMA(closes, emaLength);
  const atr = calculateATR(highs, lows, closes, 14);
  const adxData = calculateADX(highs, lows, closes, 14);
  
  // Calcular slope da EMA
  const slopeLookback = config.entry?.emaSlopeLookback || 5;
  const ema50Slope = calculateSlope(ema50, slopeLookback);
  
  // Volume médio
  const avgPeriod = config.entry?.volumeAvgPeriod || config.volume?.avgPeriod || 20;
  const volumeAvg = volumes.slice(-avgPeriod).reduce((a, b) => a + b, 0) / avgPeriod;
  
  // Swings (pivots)
  const pivotLookback = config.entry?.pivotLookback || 5;
  const swings = detectSwings(highs, lows, 20, pivotLookback);
  
  const currentIdx = closes.length - 1;
  const currentClose = closes[currentIdx];
  const currentVolume = volumes[currentIdx];
  const currentEMA = ema50[ema50.length - 1];
  const atrCurrent = atr.length > 0 ? atr[atr.length - 1] : 0;
  const adxCurrent = adxData.length > 0 ? adxData[adxData.length - 1] : { adx: 0, plusDI: 0, minusDI: 0 };
  
  // ADX rising check
  let adxRising = false;
  if (config.entry?.adxRising && adxData.length >= 2) {
    const adxPrev = adxData[adxData.length - 2];
    adxRising = adxCurrent.adx > adxPrev.adx;
  }
  
  // RSI (apenas se habilitado como filtro)
  let rsiCurrent = 50;
  if (config.entry?.useRSI) {
    const rsiPeriod = config.entry?.rsiPeriod || 14;
    const rsi = calculateRSI(closes, rsiPeriod);
    rsiCurrent = rsi.length > 0 ? rsi[rsi.length - 1] : 50;
  }
  
  return {
    ema50: {
      series: ema50,
      current: currentEMA,
      slope: ema50Slope
    },
    atr: {
      series: atr,
      current: atrCurrent
    },
    adx: {
      ...adxCurrent,
      rising: adxRising
    },
    volume: {
      current: currentVolume,
      avg: volumeAvg,
      ratio: currentVolume / volumeAvg
    },
    swings,
    price: {
      current: currentClose,
      high: highs[currentIdx],
      low: lows[currentIdx]
    },
    rsi: rsiCurrent,
    candle: data[currentIdx],
    raw: { closes, highs, lows, volumes }
  };
};

/**
 * Calcula pullback percentual em relação à pernada
 */
const calculatePullback = (currentPrice, swingHigh, swingLow, direction) => {
  if (!swingHigh || !swingLow) return null;
  
  const legSize = swingHigh - swingLow;
  if (legSize <= 0) return null;
  
  if (direction === 'buy') {
    // Pullback de uma alta (preço recuou do topo)
    return (swingHigh - currentPrice) / legSize;
  } else {
    // Pullback de uma baixa (preço subiu do fundo)
    return (currentPrice - swingLow) / legSize;
  }
};

/**
 * Gera sinal com lógica simplificada v1.1+
 * 
 * Condições de entrada:
 * 1. EMA50 inclinada (ascendente ou descendente)
 * 2. ADX > 25
 * 3. Candle rompe pivô estrutural
 * 4. Pullback entre 30% e 60% da pernada
 * 5. Volume >= média
 */
export const generateSimplifiedSignal = (data, symbol = 'ETHUSDT', versionConfig = null) => {
  const config = versionConfig || STRATEGY_V1_1;
  const { entry, regime } = config;
  
  if (!data || data.length < 100) {
    return {
      hasSignal: false,
      reason: 'Dados insuficientes',
      minRequired: 100,
      received: data?.length || 0
    };
  }
  
  // Preparar indicadores
  const indicators = prepareSimplifiedIndicators(data, config);
  
  const { ema50, atr, adx, volume, swings, price, rsi, candle } = indicators;
  
  // Determinar direção baseada na EMA
  const isAboveEMA = price.current > ema50.current;
  const isBelowEMA = price.current < ema50.current;
  const emaSlopeThreshold = entry.emaSlopeThreshold || 0.0005;
  const emaSlopeUp = ema50.slope > emaSlopeThreshold;
  const emaSlopeDown = ema50.slope < -emaSlopeThreshold;
  
  // Determinar direção potencial
  let direction = null;
  if (isAboveEMA && emaSlopeUp) direction = 'buy';
  else if (isBelowEMA && emaSlopeDown) direction = 'sell';
  
  // Obter swing values
  const swingHigh = swings.swingHigh?.value;
  const swingLow = swings.swingLow?.value;
  
  // Calcular pullback
  const pullback = calculatePullback(price.current, swingHigh, swingLow, direction);
  
  // Verificar rompimento de pivô
  const pivotBreakout = direction === 'buy' 
    ? price.current > swingHigh
    : direction === 'sell' 
      ? price.current < swingLow
      : false;
  
  // Calcular tamanho da pernada
  const legSize = swingHigh && swingLow ? Math.abs(swingHigh - swingLow) : 0;
  const legSizePercent = legSize / price.current;
  
  // Distância da EMA em ATRs
  const distanceFromEMA = Math.abs(price.current - ema50.current) / atr.current;
  
  // ===== CONDIÇÕES DE ENTRADA =====
  const conditions = {
    // 1. EMA50 inclinada
    emaTrend: direction !== null,
    emaSlopeValid: Math.abs(ema50.slope) >= emaSlopeThreshold,
    
    // 2. ADX > 25 (ou configurado)
    adxStrong: adx.adx >= (entry.adxMin || 25),
    adxRising: !entry.adxRising || adx.rising,
    
    // 3. Rompimento de pivô
    pivotBreakout: pivotBreakout,
    
    // 4. Pullback 30-60%
    pullbackValid: pullback !== null && 
                   pullback >= (entry.pullbackMin || 0.30) && 
                   pullback <= (entry.pullbackMax || 0.60),
    
    // 5. Volume >= média
    volumeOk: volume.ratio >= (entry.volumeMultiplier || 1.0),
    
    // 6. Pernada mínima
    legSizeValid: legSizePercent >= (entry.minLegSize || 0.002),
    
    // 7. Filtro de regime (se habilitado)
    regimeValid: !regime?.enabled || (
      adx.adx >= (regime.adxMinRegime || 20) &&
      Math.abs(ema50.slope) >= (regime.emaSlopeMin || 0.0003) &&
      distanceFromEMA <= (regime.maxDistanceFromEMA || 1.5)
    ),
    
    // 8. RSI filtro (apenas v1.4+)
    rsiFilter: !entry.useRSI || (
      direction === 'buy' 
        ? rsi < (entry.rsiOverbought || 75)
        : rsi > (entry.rsiOversold || 25)
    )
  };
  
  // Verificar todas as condições
  const allConditionsMet = Object.values(conditions).every(c => c === true);
  
  // Motivos de rejeição
  const rejectionReasons = [];
  if (!conditions.emaTrend) rejectionReasons.push('Sem tendência clara (EMA)');
  if (!conditions.emaSlopeValid) rejectionReasons.push(`Inclinação EMA insuficiente (${(ema50.slope * 100).toFixed(3)}%)`);
  if (!conditions.adxStrong) rejectionReasons.push(`ADX fraco (${adx.adx.toFixed(1)} < ${entry.adxMin || 25})`);
  if (!conditions.adxRising) rejectionReasons.push('ADX não está subindo');
  if (!conditions.pivotBreakout) rejectionReasons.push('Sem rompimento de pivô');
  if (!conditions.pullbackValid) rejectionReasons.push(`Pullback fora do range (${pullback ? (pullback * 100).toFixed(0) : 'N/A'}%)`);
  if (!conditions.volumeOk) rejectionReasons.push(`Volume insuficiente (${volume.ratio.toFixed(2)}x)`);
  if (!conditions.legSizeValid) rejectionReasons.push(`Pernada pequena (${(legSizePercent * 100).toFixed(2)}%)`);
  if (!conditions.regimeValid) rejectionReasons.push('Regime de mercado desfavorável');
  if (!conditions.rsiFilter) rejectionReasons.push(`RSI em extremo (${rsi.toFixed(1)})`);
  
  if (!allConditionsMet) {
    return {
      hasSignal: false,
      direction,
      conditions,
      rejectionReasons,
      indicators: {
        price: price.current,
        ema50: ema50.current,
        ema50Slope: ema50.slope,
        adx: adx.adx,
        adxRising: adx.rising,
        volumeRatio: volume.ratio,
        pullback,
        swingHigh,
        swingLow,
        legSize,
        distanceFromEMA,
        atr: atr.current,
        rsi
      },
      config: { version: config.version }
    };
  }
  
  // ===== CALCULAR TP/SL FIXO =====
  const { risk } = config;
  const slMultiplier = risk.slMultiplier || 1.35;
  const tpMultiplier = risk.tpMultiplier || 2.75;
  
  const slDistance = atr.current * slMultiplier;
  const tpDistance = atr.current * tpMultiplier;
  
  let stopLoss, takeProfit;
  
  if (direction === 'buy') {
    stopLoss = price.current - slDistance;
    takeProfit = price.current + tpDistance;
  } else {
    stopLoss = price.current + slDistance;
    takeProfit = price.current - tpDistance;
  }
  
  // Validar SL range
  const slPercent = (slDistance / price.current) * 100;
  const slMinPercent = risk.slMinPercent || 0.3;
  const slMaxPercent = risk.slMaxPercent || 1.5;
  
  if (slPercent < slMinPercent || slPercent > slMaxPercent) {
    // Ajustar SL para ficar dentro do range
    const adjustedSL = slPercent < slMinPercent 
      ? price.current * (slMinPercent / 100)
      : price.current * (slMaxPercent / 100);
    
    if (direction === 'buy') {
      stopLoss = price.current - adjustedSL;
    } else {
      stopLoss = price.current + adjustedSL;
    }
  }
  
  const riskReward = tpDistance / slDistance;
  
  // ===== CONSTRUIR SINAL =====
  return {
    hasSignal: true,
    signal: {
      type: direction === 'buy' ? 'COMPRA' : 'VENDA',
      direction,
      symbol,
      entryPrice: price.current,
      takeProfit,
      stopLoss,
      riskReward: Math.round(riskReward * 100) / 100,
      timestamp: new Date().toISOString(),
      strength: 100, // Simplificado - todas condições atendidas
      category: 'strong'
    },
    conditions,
    indicators: {
      price: price.current,
      ema50: ema50.current,
      ema50Slope: ema50.slope,
      adx: adx.adx,
      adxRising: adx.rising,
      volumeRatio: volume.ratio,
      pullback,
      swingHigh,
      swingLow,
      legSize,
      distanceFromEMA,
      atr: atr.current,
      rsi
    },
    riskLevels: {
      sl: stopLoss,
      tp: takeProfit,
      slPercent: Math.round(slPercent * 100) / 100,
      tpPercent: Math.round((tpDistance / price.current) * 10000) / 100,
      riskReward,
      slMultiplier,
      tpMultiplier,
      atr: atr.current
    },
    config: { version: config.version }
  };
};

/**
 * Calcula TP/SL fixo baseado em ATR
 */
export const calculateFixedTPSL = (entryPrice, atr, direction, config) => {
  const { risk } = config;
  const slMultiplier = risk.slMultiplier || 1.35;
  const tpMultiplier = risk.tpMultiplier || 2.75;
  
  const slDistance = atr * slMultiplier;
  const tpDistance = atr * tpMultiplier;
  
  let stopLoss, takeProfit;
  
  if (direction === 'buy') {
    stopLoss = entryPrice - slDistance;
    takeProfit = entryPrice + tpDistance;
  } else {
    stopLoss = entryPrice + slDistance;
    takeProfit = entryPrice - tpDistance;
  }
  
  return {
    stopLoss,
    takeProfit,
    slDistance,
    tpDistance,
    slPercent: (slDistance / entryPrice) * 100,
    tpPercent: (tpDistance / entryPrice) * 100,
    riskReward: tpDistance / slDistance
  };
};

export default {
  prepareSimplifiedIndicators,
  generateSimplifiedSignal,
  calculateFixedTPSL
};
