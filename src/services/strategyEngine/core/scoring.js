/**
 * SISTEMA DE SCORING PROBABILÍSTICO
 * Calcula score com pesos explícitos e calibrados
 * Normaliza por ATR/z-score para evitar vieses
 */

import { normalizeByATR, calculateZScore } from './indicators';

/**
 * Estrutura do resultado de scoring
 * @typedef {Object} ScoringResult
 * @property {number} totalScore - Score total (0-100)
 * @property {string} category - 'strong', 'medium', 'weak', 'rejected'
 * @property {Object} breakdown - Detalhamento por indicador
 * @property {Object} metrics - Métricas brutas
 * @property {boolean} allowEntry - Se permite entrada
 * @property {string} regime - Regime de mercado detectado
 */

/**
 * Calcula score de um indicador com base em condições
 * @param {Object} conditions - Condições atendidas
 * @param {number} maxWeight - Peso máximo do indicador
 * @returns {Object} - Score e detalhes
 */
const scoreIndicator = (conditions, maxWeight) => {
  const { met, partial, penalty } = conditions;
  
  let score = 0;
  let status = 'failed';
  
  if (met) {
    score = maxWeight;
    status = 'passed';
  } else if (partial) {
    score = maxWeight * 0.5;
    status = 'partial';
  }
  
  if (penalty) {
    score = Math.max(0, score - penalty);
  }
  
  return { score, maxWeight, status, percentage: (score / maxWeight) * 100 };
};

/**
 * Detecta regime de mercado
 * @param {Object} indicators - Indicadores calculados
 * @param {Object} config - Configuração
 * @returns {string} - 'trend', 'consolidation', 'strongRally'
 */
export const detectMarketRegime = (indicators, config) => {
  const { adx, priceChange4h, volumeRatio } = indicators;
  const { strongRally } = config;
  
  // Verificar modo alta forte
  if (strongRally?.enabled) {
    const { detection } = strongRally;
    if (
      priceChange4h >= detection.minPriceChange &&
      volumeRatio >= detection.minVolumeMultiplier &&
      adx >= detection.minADX
    ) {
      return 'strongRally';
    }
  }
  
  // Regime normal
  if (adx >= 25) {
    return 'trend';
  } else if (adx < 20) {
    return 'consolidation';
  }
  
  return 'transition';
};

/**
 * Calcula score do Nível 1 (Obrigatórios)
 */
export const scoreLevel1 = (data, direction, config) => {
  const { breakout, trendAlignment, candleStrength, atr } = data;
  const weights = config.indicators.level1;
  
  const results = {
    breakout: { score: 0, maxWeight: weights.breakout.weight, status: 'failed', details: {} },
    trendDirection: { score: 0, maxWeight: weights.trendDirection.weight, status: 'failed', details: {} },
    candleStrength: { score: 0, maxWeight: weights.candleStrength.weight, status: 'failed', details: {} }
  };
  
  // 1. Breakout (validado por ATR)
  const breakoutATRMultiple = breakout.distance / atr;
  const breakoutConfig = config.breakout.atrMultiplier;
  
  if (breakoutATRMultiple >= breakoutConfig.strong) {
    results.breakout = scoreIndicator({ met: true }, weights.breakout.weight);
    results.breakout.details = { type: 'strong', atrMultiple: breakoutATRMultiple };
  } else if (breakoutATRMultiple >= breakoutConfig.moderate) {
    results.breakout = scoreIndicator({ met: true, penalty: 5 }, weights.breakout.weight);
    results.breakout.details = { type: 'moderate', atrMultiple: breakoutATRMultiple };
  } else if (breakoutATRMultiple >= breakoutConfig.weak) {
    results.breakout = scoreIndicator({ partial: true }, weights.breakout.weight);
    results.breakout.details = { type: 'weak', atrMultiple: breakoutATRMultiple };
  } else {
    results.breakout.details = { type: 'none', atrMultiple: breakoutATRMultiple };
  }
  
  // 2. Direção da tendência (EMA + slope)
  const { aligned, partial, emas, slope } = trendAlignment;
  
  if (aligned && slope > config.trend.slopeMinChange) {
    results.trendDirection = scoreIndicator({ met: true }, weights.trendDirection.weight);
    results.trendDirection.details = { aligned: true, slope, emas };
  } else if (partial) {
    results.trendDirection = scoreIndicator({ partial: true }, weights.trendDirection.weight);
    results.trendDirection.details = { aligned: false, partial: true, slope, emas };
  } else {
    results.trendDirection.details = { aligned: false, partial: false, slope, emas };
  }
  
  // 3. Força do candle
  if (candleStrength.isStrong) {
    results.candleStrength = scoreIndicator({ met: true }, weights.candleStrength.weight);
  } else if (candleStrength.score >= 50) {
    results.candleStrength = scoreIndicator({ partial: true }, weights.candleStrength.weight);
  }
  results.candleStrength.details = candleStrength;
  
  const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
  const maxScore = Object.values(results).reduce((sum, r) => sum + r.maxWeight, 0);
  
  return { results, totalScore, maxScore, percentage: (totalScore / maxScore) * 100 };
};

/**
 * Calcula score do Nível 2 (Confirmações)
 */
export const scoreLevel2 = (data, direction, config) => {
  const { volume, obv, macd, didi, atr, volumeAvg } = data;
  const weights = config.indicators.level2;
  
  const results = {
    volume: { score: 0, maxWeight: weights.volume.weight, status: 'failed', details: {} },
    obv: { score: 0, maxWeight: weights.obv.weight, status: 'failed', details: {} },
    macd: { score: 0, maxWeight: weights.macd.weight, status: 'failed', details: {} },
    didi: { score: 0, maxWeight: weights.didi.weight, status: 'failed', details: {} }
  };
  
  // 1. Volume
  const volumeRatio = volume / volumeAvg;
  const volThresholds = config.volume.thresholds;
  
  if (volumeRatio >= volThresholds.strong) {
    results.volume = scoreIndicator({ met: true }, weights.volume.weight);
    results.volume.details = { ratio: volumeRatio, type: 'strong' };
  } else if (volumeRatio >= volThresholds.normal) {
    results.volume = scoreIndicator({ met: true, penalty: 3 }, weights.volume.weight);
    results.volume.details = { ratio: volumeRatio, type: 'normal' };
  } else if (volumeRatio >= volThresholds.weak) {
    results.volume = scoreIndicator({ partial: true }, weights.volume.weight);
    results.volume.details = { ratio: volumeRatio, type: 'weak' };
  } else {
    results.volume.details = { ratio: volumeRatio, type: 'insufficient' };
  }
  
  // 2. OBV
  const obvTrend = obv.current > obv.previous5 ? 'up' : 'down';
  const obvAligned = (direction === 'buy' && obvTrend === 'up') || (direction === 'sell' && obvTrend === 'down');
  
  if (obvAligned && !obv.divergence) {
    results.obv = scoreIndicator({ met: true }, weights.obv.weight);
  } else if (obvAligned) {
    results.obv = scoreIndicator({ partial: true }, weights.obv.weight);
  }
  results.obv.details = { trend: obvTrend, aligned: obvAligned, divergence: obv.divergence };
  
  // 3. MACD
  const macdFavorable = direction === 'buy'
    ? (macd.histogram > 0 || macd.crossing === 'bullish')
    : (macd.histogram < 0 || macd.crossing === 'bearish');
  const macdGrowing = direction === 'buy'
    ? macd.histogram > macd.histogramPrev
    : macd.histogram < macd.histogramPrev;
  
  if (macdFavorable && macdGrowing) {
    results.macd = scoreIndicator({ met: true }, weights.macd.weight);
  } else if (macdFavorable || macdGrowing) {
    results.macd = scoreIndicator({ partial: true }, weights.macd.weight);
  }
  results.macd.details = { favorable: macdFavorable, growing: macdGrowing, histogram: macd.histogram };
  
  // 4. Didi (Agulhada)
  const didiConfirm = direction === 'buy'
    ? (didi.short > didi.medium && didi.short > didi.long)
    : (didi.short < didi.medium && didi.short < didi.long);
  
  if (didiConfirm) {
    results.didi = scoreIndicator({ met: true }, weights.didi.weight);
  }
  results.didi.details = { confirmed: didiConfirm, values: didi };
  
  const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
  const maxScore = Object.values(results).reduce((sum, r) => sum + r.maxWeight, 0);
  
  return { results, totalScore, maxScore, percentage: (totalScore / maxScore) * 100 };
};

/**
 * Calcula score do Nível 3 (Situacionais)
 */
export const scoreLevel3 = (data, direction, regime, config) => {
  const { rsi, adx, vroc } = data;
  const weights = config.indicators.level3;
  
  const results = {
    rsi: { score: 0, maxWeight: weights.rsi.weight, status: 'failed', details: {} },
    adx: { score: 0, maxWeight: weights.adx.weight, status: 'failed', details: {} },
    vroc: { score: 0, maxWeight: weights.vroc?.weight || 0, status: 'failed', details: {} }
  };
  
  // 1. RSI (nunca bloqueia, apenas ajusta score)
  const rsiConfig = config.rsi;
  const ranges = direction === 'buy' ? rsiConfig.ranges.buy : rsiConfig.ranges.sell;
  const rsiInRange = rsi >= ranges.min && rsi <= ranges.max;
  
  let rsiPenalty = 0;
  if (rsi > rsiConfig.penaltyZones.overbought.threshold) {
    rsiPenalty = rsiConfig.penaltyZones.overbought.penalty;
  } else if (rsi < rsiConfig.penaltyZones.oversold.threshold) {
    rsiPenalty = rsiConfig.penaltyZones.oversold.penalty;
  }
  
  // Em regime de tendência, privilegiar comportamento relativo ao midline
  if (regime === 'trend') {
    const midlineOk = direction === 'buy' ? rsi > rsiConfig.midline : rsi < rsiConfig.midline;
    if (rsiInRange && midlineOk) {
      results.rsi = scoreIndicator({ met: true, penalty: rsiPenalty }, weights.rsi.weight);
    } else if (rsiInRange) {
      results.rsi = scoreIndicator({ partial: true, penalty: rsiPenalty }, weights.rsi.weight);
    }
  } else {
    if (rsiInRange) {
      results.rsi = scoreIndicator({ met: true, penalty: rsiPenalty }, weights.rsi.weight);
    }
  }
  results.rsi.details = { value: rsi, inRange: rsiInRange, penalty: rsiPenalty, regime };
  
  // 2. ADX
  const adxConfig = config.adx;
  if (adx >= adxConfig.regimes.strongTrend.min) {
    results.adx = scoreIndicator({ met: true }, weights.adx.weight);
    results.adx.score += adxConfig.regimes.strongTrend.scoreBonus;
    results.adx.details = { value: adx, regime: 'strongTrend', bonus: adxConfig.regimes.strongTrend.scoreBonus };
  } else if (adx >= adxConfig.regimes.normalTrend.min) {
    results.adx = scoreIndicator({ met: true }, weights.adx.weight);
    results.adx.details = { value: adx, regime: 'normalTrend', bonus: 0 };
  } else if (adx >= adxConfig.regimes.weakTrend.min) {
    results.adx = scoreIndicator({ partial: true }, weights.adx.weight);
    results.adx.details = { value: adx, regime: 'weakTrend', reduceWeight: true };
  } else {
    results.adx.details = { value: adx, regime: 'chop', blockContinuation: true };
  }
  
  // 3. VROC (se disponível)
  if (vroc !== undefined && weights.vroc?.weight > 0) {
    const vrocPositive = direction === 'buy' ? vroc > 0 : vroc < 0;
    if (vrocPositive) {
      results.vroc = scoreIndicator({ met: true }, weights.vroc.weight);
    }
    results.vroc.details = { value: vroc, favorable: vrocPositive };
  }
  
  const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
  const maxScore = Object.values(results).reduce((sum, r) => sum + r.maxWeight, 0);
  
  return { results, totalScore, maxScore, percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 100 };
};

/**
 * Calcula score total combinando todos os níveis
 */
export const calculateTotalScore = (level1, level2, level3, regime, config) => {
  const totalScore = level1.totalScore + level2.totalScore + level3.totalScore;
  const maxScore = level1.maxScore + level2.maxScore + level3.maxScore;
  const percentage = (totalScore / maxScore) * 100;
  
  // Determinar categoria
  const thresholds = config.scoring.thresholds;
  let category = 'rejected';
  if (percentage >= thresholds.strong) category = 'strong';
  else if (percentage >= thresholds.medium) category = 'medium';
  else if (percentage >= thresholds.weak) category = 'weak';
  
  // Verificar se permite entrada baseado no regime
  const minScoreForRegime = config.scoring.minScoreByRegime[regime] || config.scoring.thresholds.medium;
  const allowEntry = percentage >= minScoreForRegime;
  
  return {
    totalScore,
    maxScore,
    percentage: Math.round(percentage * 10) / 10,
    category,
    allowEntry,
    regime,
    minScoreRequired: minScoreForRegime,
    breakdown: {
      level1: { ...level1, weight: 'high', label: 'Obrigatórios' },
      level2: { ...level2, weight: 'medium', label: 'Confirmações' },
      level3: { ...level3, weight: 'low', label: 'Situacionais' }
    }
  };
};

/**
 * Aplica ajustes do modo alta forte
 */
export const applyStrongRallyAdjustments = (scoringResult, config) => {
  if (scoringResult.regime !== 'strongRally') {
    return scoringResult;
  }
  
  const adjusted = { ...scoringResult };
  const relaxedParams = config.strongRally.relaxedParams;
  
  // Ajustar threshold mínimo
  adjusted.minScoreRequired = relaxedParams.minScore;
  
  // Reavaliar se permite entrada
  adjusted.allowEntry = adjusted.percentage >= relaxedParams.minScore;
  
  // Adicionar flag
  adjusted.strongRallyMode = true;
  
  return adjusted;
};

export default {
  detectMarketRegime,
  scoreLevel1,
  scoreLevel2,
  scoreLevel3,
  calculateTotalScore,
  applyStrongRallyAdjustments
};
