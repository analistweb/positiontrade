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
