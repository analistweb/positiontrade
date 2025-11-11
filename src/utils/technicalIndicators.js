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

// Calcular níveis de Fibonacci
export const calculateFibonacciLevels = (startPrice, endPrice, direction = 'up') => {
  const diff = endPrice - startPrice;
  
  const levels = {
    0: startPrice,
    0.236: direction === 'up' ? endPrice - diff * 0.236 : startPrice + diff * 0.236,
    0.382: direction === 'up' ? endPrice - diff * 0.382 : startPrice + diff * 0.382,
    0.5: direction === 'up' ? endPrice - diff * 0.5 : startPrice + diff * 0.5,
    0.618: direction === 'up' ? endPrice - diff * 0.618 : startPrice + diff * 0.618,
    0.786: direction === 'up' ? endPrice - diff * 0.786 : startPrice + diff * 0.786,
    1: endPrice
  };
  
  return levels;
};

// Determinar níveis de TP e SL baseado no ADX
export const getAdaptiveFibonacciTargets = (adx, direction = 'buy') => {
  // ADX forte (> 40): TP agressivo (0.618), SL apertado (0.5)
  // ADX médio (25-40): TP moderado (0.5), SL moderado (0.618)
  // ADX fraco (< 25): TP conservador (0.382), SL largo (0.786)
  
  let tpLevel, slLevel;
  
  if (adx > 40) {
    tpLevel = 0.618;
    slLevel = 0.5;
  } else if (adx > 30) {
    tpLevel = 0.5;
    slLevel = 0.618;
  } else {
    tpLevel = 0.382;
    slLevel = 0.786;
  }
  
  return { tpLevel, slLevel };
};
