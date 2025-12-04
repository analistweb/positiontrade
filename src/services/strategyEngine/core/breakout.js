/**
 * MÓDULO DE BREAKOUT - VALIDAÇÃO COM ATR E CATEGORIZAÇÃO
 * Substitui threshold fixo por múltiplo de ATR
 * Implementa categorias: forte, moderado, parcial, exaustão
 */

/**
 * Valida breakout com base em ATR
 * @param {Object} candle - Candle atual
 * @param {Object} reference - Candle/nível de referência
 * @param {number} atr - ATR atual
 * @param {string} direction - 'buy' ou 'sell'
 * @param {Object} config - Configuração de breakout
 * @returns {Object} - Resultado da validação
 */
export const validateBreakout = (candle, reference, atr, direction, config) => {
  const { atrMultiplier, categories, exhaustion } = config;
  
  // Calcular distância do breakout
  let breakoutDistance = 0;
  let hasBreakout = false;
  
  if (direction === 'buy') {
    if (candle.close > reference.high) {
      breakoutDistance = candle.close - reference.high;
      hasBreakout = true;
    }
  } else {
    if (candle.close < reference.low) {
      breakoutDistance = reference.low - candle.close;
      hasBreakout = true;
    }
  }
  
  if (!hasBreakout) {
    return {
      isValid: false,
      category: 'none',
      distance: 0,
      atrMultiple: 0,
      reason: 'Sem rompimento de preço'
    };
  }
  
  // Calcular múltiplo de ATR
  const atrMultiple = breakoutDistance / atr;
  
  // Determinar categoria
  let category = 'weak';
  if (atrMultiple >= atrMultiplier.strong) {
    category = 'strong';
  } else if (atrMultiple >= atrMultiplier.moderate) {
    category = 'moderate';
  } else if (atrMultiple >= atrMultiplier.weak) {
    category = 'weak';
  } else {
    return {
      isValid: false,
      category: 'micro',
      distance: breakoutDistance,
      atrMultiple,
      reason: `Micro rompimento (${(atrMultiple * 100).toFixed(1)}% ATR < ${atrMultiplier.weak * 100}%)`
    };
  }
  
  // Verificar exaustão
  const exhaustionCheck = checkExhaustion(candle, reference, atr, direction, exhaustion);
  if (exhaustionCheck.isExhausted) {
    return {
      isValid: false,
      category: 'exhaustion',
      distance: breakoutDistance,
      atrMultiple,
      reason: exhaustionCheck.reason,
      exhaustionDetails: exhaustionCheck
    };
  }
  
  return {
    isValid: true,
    category,
    distance: breakoutDistance,
    atrMultiple,
    percentageDistance: (breakoutDistance / reference.close) * 100,
    categoryConfig: categories[category]
  };
};

/**
 * Verifica sinais de exaustão
 */
export const checkExhaustion = (candle, reference, atr, direction, config) => {
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  const isBullish = candle.close > candle.open;
  
  // 1. Wick contra muito grande
  let wickAgainst = 0;
  if (direction === 'buy') {
    wickAgainst = isBullish ? (candle.high - candle.close) : (candle.high - candle.open);
  } else {
    wickAgainst = isBullish ? (candle.open - candle.low) : (candle.close - candle.low);
  }
  
  const wickRatio = body > 0 ? wickAgainst / body : 0;
  if (wickRatio > config.maxWickRatio) {
    return {
      isExhausted: true,
      reason: `Wick contra excessivo (${(wickRatio * 100).toFixed(0)}% > ${config.maxWickRatio * 100}%)`,
      wickRatio
    };
  }
  
  // 2. Corpo muito pequeno em relação ao range
  const bodyRatio = range > 0 ? body / range : 0;
  if (bodyRatio < config.minBodyRatio) {
    return {
      isExhausted: true,
      reason: `Corpo fraco (${(bodyRatio * 100).toFixed(0)}% < ${config.minBodyRatio * 100}%)`,
      bodyRatio
    };
  }
  
  return { isExhausted: false, wickRatio, bodyRatio };
};

/**
 * Verifica distância da EMA/VWAP para filtro de exaustão
 */
export const checkDistanceFromMA = (price, ema, atr, maxDistance) => {
  const distance = Math.abs(price - ema);
  const atrMultiple = distance / atr;
  
  return {
    distance,
    atrMultiple,
    isTooFar: atrMultiple > maxDistance,
    percentage: (distance / ema) * 100
  };
};

/**
 * Calcula força do breakout (0-100)
 */
export const calculateBreakoutStrength = (breakout, candle, volume, volumeAvg, config) => {
  let strength = 0;
  const details = {};
  
  // 1. Distância do breakout (0-30 pts)
  const distanceScore = Math.min(breakout.atrMultiple / config.atrMultiplier.strong, 1) * 30;
  strength += distanceScore;
  details.distanceScore = distanceScore;
  
  // 2. Volume (0-30 pts)
  const volumeRatio = volume / volumeAvg;
  const volumeScore = Math.min(volumeRatio / 2, 1) * 30;
  strength += volumeScore;
  details.volumeScore = volumeScore;
  details.volumeRatio = volumeRatio;
  
  // 3. Corpo do candle (0-20 pts)
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  const bodyRatio = range > 0 ? body / range : 0;
  const bodyScore = bodyRatio * 20;
  strength += bodyScore;
  details.bodyScore = bodyScore;
  
  // 4. Fechamento favorável (0-20 pts)
  const isBullish = candle.close > candle.open;
  const closePosition = range > 0 ? (candle.close - candle.low) / range : 0.5;
  const positionScore = (isBullish ? closePosition : 1 - closePosition) * 20;
  strength += positionScore;
  details.positionScore = positionScore;
  
  return {
    strength: Math.round(strength),
    details,
    isStrong: strength >= 70,
    isModerate: strength >= 50 && strength < 70,
    isWeak: strength >= 30 && strength < 50
  };
};

/**
 * Valida breakout intrabar (durante formação do candle)
 */
export const validateIntrabarBreakout = (
  currentCandle,
  reference,
  atr,
  recentTicks,
  direction,
  config
) => {
  // Validação básica de breakout
  const basicBreakout = validateBreakout(currentCandle, reference, atr, direction, config);
  
  if (!basicBreakout.isValid) {
    return basicBreakout;
  }
  
  // Validação adicional para intrabar
  const body = Math.abs(currentCandle.close - currentCandle.open);
  
  // Corpo parcial >= 35% do ATR
  if (body < atr * 0.35) {
    return {
      ...basicBreakout,
      isValid: false,
      reason: `Corpo parcial insuficiente (${((body / atr) * 100).toFixed(0)}% ATR < 35%)`
    };
  }
  
  // Verificar progressão de ticks (se disponível)
  if (recentTicks && recentTicks.length >= 3) {
    const isProgressive = checkTickProgression(recentTicks, direction);
    if (!isProgressive) {
      return {
        ...basicBreakout,
        isValid: false,
        reason: 'Sem progressão consistente nos últimos ticks'
      };
    }
  }
  
  // Projetar volume
  const volumeProjection = currentCandle.volume * 1.5; // Estimativa simples
  
  return {
    ...basicBreakout,
    intrabar: true,
    projectedVolume: volumeProjection,
    bodyATRRatio: body / atr
  };
};

/**
 * Verifica progressão de ticks
 */
const checkTickProgression = (ticks, direction) => {
  if (ticks.length < 3) return true;
  
  const last3 = ticks.slice(-3);
  
  if (direction === 'buy') {
    // Para compra, máximas devem ser progressivas
    return last3[1].high >= last3[0].high && last3[2].high >= last3[1].high;
  } else {
    // Para venda, mínimas devem ser progressivas (decrescentes)
    return last3[1].low <= last3[0].low && last3[2].low <= last3[1].low;
  }
};

/**
 * Encontra candle de referência (menor corpo nas últimas N velas)
 */
export const findReferenceCandle = (candles, lookback = 5) => {
  if (!candles || candles.length < lookback + 1) {
    return null;
  }
  
  const recent = candles.slice(-(lookback + 1), -1); // Exclui candle atual
  
  let smallestIndex = 0;
  let smallestBody = Infinity;
  
  recent.forEach((candle, idx) => {
    const body = Math.abs(candle.close - candle.open);
    if (body < smallestBody) {
      smallestBody = body;
      smallestIndex = idx;
    }
  });
  
  return {
    candle: recent[smallestIndex],
    index: smallestIndex,
    body: smallestBody
  };
};

export default {
  validateBreakout,
  checkExhaustion,
  checkDistanceFromMA,
  calculateBreakoutStrength,
  validateIntrabarBreakout,
  findReferenceCandle
};
