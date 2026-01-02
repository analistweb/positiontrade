// Didi Index (Médias Móveis: 3, 8, 20)
export const calculateDidiIndex = (closes) => {
  const shortPeriod = 3;
  const mediumPeriod = 8;
  const longPeriod = 20;

  const sma = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  };

  return {
    short: sma(closes, shortPeriod),
    medium: sma(closes, mediumPeriod),
    long: sma(closes, longPeriod)
  };
};

// DMI (Directional Movement Index)
export const calculateDMI = (highs, lows, closes, period = 14) => {
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

    const plusDI = (plusDM / tr) * 100;
    const minusDI = (minusDM / tr) * 100;
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    
    // ADX é a média móvel do DX
    const adx = results.length > 0 
      ? (results[results.length - 1].adx * (period - 1) + dx) / period
      : dx;

    results.push({ plusDI, minusDI, adx });
  }

  return results;
};

// EMA (Exponential Moving Average)
export const calculateEMA = (closes, period) => {
  const k = 2 / (period + 1);
  const emaArray = [closes[0]];

  for (let i = 1; i < closes.length; i++) {
    const ema = closes[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(ema);
  }

  return emaArray;
};

// ATR (Average True Range)
export const calculateATR = (highs, lows, closes, period = 14) => {
  const trueRanges = [];
  
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  const atrArray = [];
  for (let i = period - 1; i < trueRanges.length; i++) {
    const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    atrArray.push(sum / period);
  }

  return atrArray;
};

// Pivot High (máxima local)
export const findPivotHigh = (highs, leftBars = 5, rightBars = 5) => {
  const pivots = [];
  
  for (let i = leftBars; i < highs.length - rightBars; i++) {
    let isPivot = true;
    const currentHigh = highs[i];
    
    // Verifica se é maior que as barras à esquerda
    for (let j = i - leftBars; j < i; j++) {
      if (highs[j] >= currentHigh) {
        isPivot = false;
        break;
      }
    }
    
    // Verifica se é maior que as barras à direita
    if (isPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (highs[j] > currentHigh) {
          isPivot = false;
          break;
        }
      }
    }
    
    if (isPivot) {
      pivots.push({ index: i, value: currentHigh });
    }
  }
  
  return pivots;
};

// Pivot Low (mínima local)
export const findPivotLow = (lows, leftBars = 5, rightBars = 5) => {
  const pivots = [];
  
  for (let i = leftBars; i < lows.length - rightBars; i++) {
    let isPivot = true;
    const currentLow = lows[i];
    
    // Verifica se é menor que as barras à esquerda
    for (let j = i - leftBars; j < i; j++) {
      if (lows[j] <= currentLow) {
        isPivot = false;
        break;
      }
    }
    
    // Verifica se é menor que as barras à direita
    if (isPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (lows[j] < currentLow) {
          isPivot = false;
          break;
        }
      }
    }
    
    if (isPivot) {
      pivots.push({ index: i, value: currentLow });
    }
  }
  
  return pivots;
};

// Fibonacci Levels Calculation - Orientado pela Direção do Trade a partir da Entrada
export const calculateFibonacciLevels = (entryPrice, swingReference, direction = 'buy') => {
  // Para COMPRA: entryPrice é a base, swingReference é o topo esperado
  // Para VENDA: entryPrice é o topo, swingReference é o fundo esperado
  const diff = Math.abs(entryPrice - swingReference);
  
  if (direction === 'buy') {
    // COMPRA: Fibonacci de entrada para cima (projeção de alta)
    // TP acima da entrada, SL abaixo da entrada
    return {
      level_0: entryPrice,
      level_236: entryPrice + diff * 0.236,
      level_382: entryPrice + diff * 0.382,
      level_500: entryPrice + diff * 0.500,
      level_618: entryPrice + diff * 0.618,
      level_786: entryPrice + diff * 0.786,
      level_1000: entryPrice + diff,
      // Níveis de retração (para SL)
      level_neg_236: entryPrice - diff * 0.236,
      level_neg_382: entryPrice - diff * 0.382,
      level_neg_500: entryPrice - diff * 0.500,
      level_neg_618: entryPrice - diff * 0.618,
    };
  } else {
    // VENDA: Fibonacci de entrada para baixo (projeção de baixa)
    // TP abaixo da entrada, SL acima da entrada
    return {
      level_0: entryPrice,
      level_236: entryPrice - diff * 0.236,
      level_382: entryPrice - diff * 0.382,
      level_500: entryPrice - diff * 0.500,
      level_618: entryPrice - diff * 0.618,
      level_786: entryPrice - diff * 0.786,
      level_1000: entryPrice - diff,
      // Níveis de retração (para SL)
      level_neg_236: entryPrice + diff * 0.236,
      level_neg_382: entryPrice + diff * 0.382,
      level_neg_500: entryPrice + diff * 0.500,
      level_neg_618: entryPrice + diff * 0.618,
    };
  }
};

// Adaptive Fibonacci Targets based on ADX - Orientado pela Direção
export const getAdaptiveFibonacciTargets = (adx, direction = 'buy') => {
  let targets = {};
  
  // ADX strength categories
  if (adx >= 50) {
    // Tendência muito forte - targets agressivos
    targets = { tpLevel: 'level_618', slLevel: 'level_neg_382' };
  } else if (adx >= 40) {
    // Tendência forte
    targets = { tpLevel: 'level_500', slLevel: 'level_neg_382' };
  } else if (adx >= 30) {
    // Tendência moderada
    targets = { tpLevel: 'level_382', slLevel: 'level_neg_382' };
  } else if (adx >= 25) {
    // Tendência fraca
    targets = { tpLevel: 'level_382', slLevel: 'level_neg_500' };
  } else {
    // Sem tendência clara - conservador
    targets = { tpLevel: 'level_236', slLevel: 'level_neg_618' };
  }

  return targets;
};

// Calcular TP/SL baseado em Fibonacci e ADX
export const calculateTPSL = (entryPrice, swingReference, adx, direction = 'buy') => {
  // swingReference: para COMPRA é o swing high esperado, para VENDA é o swing low esperado
  const fibLevels = calculateFibonacciLevels(entryPrice, swingReference, direction);
  const targets = getAdaptiveFibonacciTargets(adx, direction);
  
  const tp = fibLevels[targets.tpLevel];
  const sl = fibLevels[targets.slLevel];
  
  if (direction === 'buy') {
    // COMPRA: TP deve ser > entrada, SL deve ser < entrada
    if (tp <= entryPrice) {
      console.error('❌ COMPRA: TP inválido', { entrada: entryPrice, tp, tpLevel: targets.tpLevel });
      return { tp: null, sl: null, fibLevels };
    }
    if (sl >= entryPrice) {
      console.error('❌ COMPRA: SL inválido', { entrada: entryPrice, sl, slLevel: targets.slLevel });
      return { tp: null, sl: null, fibLevels };
    }
    
    console.log('✅ COMPRA: TP/SL calculados', { 
      entrada: entryPrice, 
      tp, 
      sl, 
      tpLevel: targets.tpLevel, 
      slLevel: targets.slLevel,
      adx 
    });
    
    return { tp, sl, fibLevels };
  } else {
    // VENDA: TP deve ser < entrada, SL deve ser > entrada
    if (tp >= entryPrice) {
      console.error('❌ VENDA: TP inválido', { entrada: entryPrice, tp, tpLevel: targets.tpLevel });
      return { tp: null, sl: null, fibLevels };
    }
    if (sl <= entryPrice) {
      console.error('❌ VENDA: SL inválido', { entrada: entryPrice, sl, slLevel: targets.slLevel });
      return { tp: null, sl: null, fibLevels };
    }
    
    console.log('✅ VENDA: TP/SL calculados', { 
      entrada: entryPrice, 
      tp, 
      sl, 
      tpLevel: targets.tpLevel, 
      slLevel: targets.slLevel,
      adx 
    });
    
    return { tp, sl, fibLevels };
  }
};

// Validar Risco-Retorno (R:R) mínimo
export const validateRiskReward = (entryPrice, tp, sl, minRR = 1.0) => {
  const reward = Math.abs(tp - entryPrice);
  const risk = Math.abs(entryPrice - sl);
  
  if (risk === 0) return { isValid: false, ratio: 0 };
  
  const ratio = reward / risk;
  return {
    isValid: ratio >= minRR,
    ratio: ratio,
    reward: reward,
    risk: risk
  };
};

// ==================== MÓDULO A — FIBO ADAPTATIVO + SWING DETECTION ====================

/**
 * 1) Detecção de Swings (swing high/low detection)
 * @param {Array} highs - Array de máximas
 * @param {Array} lows - Array de mínimas
 * @param {number} lookbackMajor - Lookback para swings maiores (padrão: 20)
 * @param {number} lookbackMinor - Lookback para swings menores (padrão: 5)
 * @returns {Object} - Swing high e swing low válidos
 */
export const detectSwing = (highs, lows, lookbackMajor = 20, lookbackMinor = 5) => {
  const findSwingHigh = (highs, lookback) => {
    const swings = [];
    for (let i = lookback; i < highs.length - lookback; i++) {
      let isSwing = true;
      const currentHigh = highs[i];
      
      // Verificar lookback anterior e posterior
      for (let j = i - lookback; j < i + lookback; j++) {
        if (j !== i && highs[j] >= currentHigh) {
          isSwing = false;
          break;
        }
      }
      
      if (isSwing) {
        swings.push({ 
          index: i, 
          value: currentHigh,
          distance: highs.length - 1 - i 
        });
      }
    }
    return swings;
  };
  
  const findSwingLow = (lows, lookback) => {
    const swings = [];
    for (let i = lookback; i < lows.length - lookback; i++) {
      let isSwing = true;
      const currentLow = lows[i];
      
      // Verificar lookback anterior e posterior
      for (let j = i - lookback; j < i + lookback; j++) {
        if (j !== i && lows[j] <= currentLow) {
          isSwing = false;
          break;
        }
      }
      
      if (isSwing) {
        swings.push({ 
          index: i, 
          value: currentLow,
          distance: lows.length - 1 - i 
        });
      }
    }
    return swings;
  };
  
  // Tentar encontrar swings maiores primeiro
  let swingHighMajor = findSwingHigh(highs, lookbackMajor);
  let swingLowMajor = findSwingLow(lows, lookbackMajor);
  
  // Se não encontrar swings maiores, usar swings menores
  let swingHighMinor = findSwingHigh(highs, lookbackMinor);
  let swingLowMinor = findSwingLow(lows, lookbackMinor);
  
  // Priorizar swing maior, se não houver usar menor
  const validSwingHigh = swingHighMajor.length > 0 ? swingHighMajor[swingHighMajor.length - 1] : 
                        (swingHighMinor.length > 0 ? swingHighMinor[swingHighMinor.length - 1] : null);
                        
  const validSwingLow = swingLowMajor.length > 0 ? swingLowMajor[swingLowMajor.length - 1] : 
                       (swingLowMinor.length > 0 ? swingLowMinor[swingLowMinor.length - 1] : null);
  
  // Nunca usar o candle atual como swing
  const currentIndex = highs.length - 1;
  if (validSwingHigh && validSwingHigh.index === currentIndex) {
    return { swingHigh: null, swingLow: validSwingLow };
  }
  if (validSwingLow && validSwingLow.index === currentIndex) {
    return { swingHigh: validSwingHigh, swingLow: null };
  }
  
  return {
    swingHigh: validSwingHigh,
    swingLow: validSwingLow
  };
};

/**
 * 2) Cálculo da Pernada (leg)
 * @param {Object} lastSwing - Último swing detectado
 * @param {Object} previousSwing - Swing anterior
 * @returns {Object} - Pernada (leg) com tamanho e direção
 */
export const computeLeg = (lastSwing, previousSwing) => {
  if (!lastSwing || !previousSwing) {
    return { legSize: 0, direction: null };
  }
  
  const legSize = Math.abs(lastSwing.value - previousSwing.value);
  
  // Determinar direção
  let direction = null;
  if (lastSwing.value > previousSwing.value) {
    direction = 'bullish';
  } else if (lastSwing.value < previousSwing.value) {
    direction = 'bearish';
  }
  
  return {
    legSize,
    direction,
    from: previousSwing.value,
    to: lastSwing.value
  };
};

/**
 * 3) FIBO ADAPTATIVO baseado em ADX
 * @param {string} levelType - 'tp' ou 'sl'
 * @param {number} adxValue - Valor do ADX
 * @returns {number} - Nível de Fibonacci adaptativo
 */
export const getAdaptiveFib = (levelType, adxValue) => {
  let fibLevel = 0.5; // padrão médio
  
  if (adxValue > 35) {
    // Tendência forte
    fibLevel = levelType === 'tp' ? 0.618 : 0.382;
  } else if (adxValue >= 27 && adxValue <= 35) {
    // Tendência média
    fibLevel = 0.5;
  } else if (adxValue >= 22 && adxValue < 27) {
    // Tendência fraca
    fibLevel = levelType === 'tp' ? 0.382 : 0.618;
  }
  
  return fibLevel;
};

/**
 * Cálculo de TP/SL com Fibonacci Adaptativo e Swings
 * @param {number} entryPrice - Preço de entrada
 * @param {Object} swingHigh - Swing high detectado
 * @param {Object} swingLow - Swing low detectado
 * @param {number} adx - Valor do ADX
 * @param {string} direction - 'buy' ou 'sell'
 * @returns {Object} - TP e SL calculados
 */
export const calculateAdaptiveTPSL = (entryPrice, swingHigh, swingLow, adx, direction) => {
  if (!swingHigh || !swingLow) {
    return { tp: null, sl: null, legSize: 0, fibUsed: null };
  }
  
  // Calcular pernada (leg)
  const leg = computeLeg(swingHigh, swingLow);
  const legSize = leg.legSize;
  
  // Obter Fibonacci adaptativo
  const tpFib = getAdaptiveFib('tp', adx);
  const slFib = getAdaptiveFib('sl', adx);
  
  let tp = null;
  let sl = null;
  
  if (direction === 'buy') {
    // COMPRA: TP acima da entrada, SL abaixo da entrada
    // TP = entrada + extensão de Fibonacci baseada na pernada
    // SL = entrada - retração de Fibonacci baseada na pernada
    tp = entryPrice + (legSize * tpFib);
    sl = entryPrice - (legSize * slFib);
    
    // Garantir SL mínimo baseado no swingLow menos buffer
    const slFromSwing = swingLow.value - (legSize * 0.1);
    if (sl > slFromSwing) {
      sl = Math.max(slFromSwing, entryPrice - (legSize * slFib * 1.5));
    }
    
    // Validar: TP > entrada > SL
    if (tp <= entryPrice || sl >= entryPrice) {
      console.warn('⚠️ COMPRA: TP/SL inválidos com Fibonacci adaptativo', {
        entrada: entryPrice,
        tp,
        sl,
        swingHigh: swingHigh.value,
        swingLow: swingLow.value
      });
      return { tp: null, sl: null, legSize, fibUsed: { tpFib, slFib } };
    }
  } else if (direction === 'sell') {
    // VENDA: TP abaixo da entrada, SL acima da entrada
    // TP = entrada - extensão de Fibonacci baseada na pernada
    // SL = entrada + retração de Fibonacci baseada na pernada
    tp = entryPrice - (legSize * tpFib);
    sl = entryPrice + (legSize * slFib);
    
    // Garantir SL máximo baseado no swingHigh mais buffer
    const slFromSwing = swingHigh.value + (legSize * 0.1);
    if (sl < slFromSwing) {
      sl = Math.min(slFromSwing, entryPrice + (legSize * slFib * 1.5));
    }
    
    // Validar: SL > entrada > TP
    if (tp >= entryPrice || sl <= entryPrice) {
      console.warn('⚠️ VENDA: TP/SL inválidos com Fibonacci adaptativo', {
        entrada: entryPrice,
        tp,
        sl,
        swingHigh: swingHigh.value,
        swingLow: swingLow.value
      });
      return { tp: null, sl: null, legSize, fibUsed: { tpFib, slFib } };
    }
  }
  
  // Validar limites de SL (0.15% a 1.5% - expandido para permitir mais trades)
  const slPercent = Math.abs((sl - entryPrice) / entryPrice);
  if (slPercent < 0.0015 || slPercent > 0.015) {
    console.warn('⚠️ SL fora dos limites (0.15% - 1.5%)', {
      slPercent: (slPercent * 100).toFixed(2) + '%',
      entrada: entryPrice,
      sl
    });
    return { tp: null, sl: null, legSize, fibUsed: { tpFib, slFib } };
  }
  
  // Validar R:R mínimo >= 1.0 (ideal >= 1.3)
  const rrValidation = validateRiskReward(entryPrice, tp, sl, 1.0);
  if (!rrValidation.isValid) {
    console.warn('⚠️ R:R abaixo do mínimo', {
      rr: rrValidation.ratio.toFixed(2),
      entrada: entryPrice,
      tp,
      sl
    });
    return { tp: null, sl: null, legSize, fibUsed: { tpFib, slFib } };
  }
  
  console.log('✅ TP/SL Adaptativos calculados:', {
    direction,
    entrada: entryPrice,
    tp,
    sl,
    legSize: legSize.toFixed(2),
    tpFib,
    slFib,
    rr: rrValidation.ratio.toFixed(2),
    adx
  });
  
  return { tp, sl, legSize, fibUsed: { tpFib, slFib }, rrRatio: rrValidation.ratio };
};
