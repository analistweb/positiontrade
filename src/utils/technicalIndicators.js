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
