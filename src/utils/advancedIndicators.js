// ========================================
// INDICADORES AVANÇADOS - FASE 1
// ========================================

// On-Balance Volume (OBV) - Mede pressão compradora/vendedora
export const calculateOBV = (closes, volumes) => {
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

// Volume Rate of Change (VROC) - Variação percentual do volume
export const calculateVROC = (volumes, period = 14) => {
  const vroc = [];
  
  for (let i = period; i < volumes.length; i++) {
    const currentVol = volumes[i];
    const pastVol = volumes[i - period];
    const change = ((currentVol - pastVol) / pastVol) * 100;
    vroc.push(change);
  }
  
  return vroc;
};

// Volume Profile Simplificado - Identifica zonas de alto volume
export const calculateVolumeProfile = (prices, volumes, bins = 10) => {
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const binSize = priceRange / bins;
  
  const profile = Array(bins).fill(0);
  
  for (let i = 0; i < prices.length; i++) {
    const binIndex = Math.min(
      Math.floor((prices[i] - minPrice) / binSize),
      bins - 1
    );
    profile[binIndex] += volumes[i];
  }
  
  // Encontrar zona de máximo volume
  const maxVolumeIndex = profile.indexOf(Math.max(...profile));
  const pocPrice = minPrice + (maxVolumeIndex * binSize) + (binSize / 2);
  
  return {
    profile,
    pocPrice, // Point of Control - preço com maior volume
    bins,
    priceRange: { min: minPrice, max: maxPrice }
  };
};

// RSI (Relative Strength Index)
export const calculateRSI = (closes, period = 14) => {
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const rsi = [];
  
  for (let i = period; i < changes.length; i++) {
    const gains = [];
    const losses = [];
    
    for (let j = i - period; j < i; j++) {
      if (changes[j] > 0) {
        gains.push(changes[j]);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(changes[j]));
      }
    }
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
};

// MACD (Moving Average Convergence Divergence)
export const calculateMACD = (closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const ema = (data, period) => {
    const k = 2 / (period + 1);
    const emaArray = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const emaValue = data[i] * k + emaArray[i - 1] * (1 - k);
      emaArray.push(emaValue);
    }
    
    return emaArray;
  };
  
  const fastEMA = ema(closes, fastPeriod);
  const slowEMA = ema(closes, slowPeriod);
  
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = ema(macdLine, signalPeriod);
  const histogram = macdLine.map((macd, i) => macd - signalLine[i]);
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
};

// Volume Breakout Strength - Analisa força do rompimento baseado em volume
export const calculateBreakoutStrength = (currentVolume, avgVolume, currentPrice, prevHigh, prevLow, breakoutType) => {
  // Volume deve ser pelo menos 1.5x a média para breakout válido
  const volumeRatio = currentVolume / avgVolume;
  const volumeStrong = volumeRatio >= 1.5;
  
  // Distância do rompimento
  let breakoutDistance = 0;
  if (breakoutType === 'buy') {
    breakoutDistance = ((currentPrice - prevHigh) / prevHigh) * 100;
  } else if (breakoutType === 'sell') {
    breakoutDistance = ((prevLow - currentPrice) / prevLow) * 100;
  }
  
  // Força do rompimento (0-100)
  const volumeScore = Math.min(volumeRatio / 3, 1) * 50; // Máximo 50 pontos
  const distanceScore = Math.min(breakoutDistance / 0.5, 1) * 50; // Máximo 50 pontos
  const strength = volumeScore + distanceScore;
  
  return {
    strength: Math.round(strength),
    volumeRatio: volumeRatio.toFixed(2),
    volumeStrong,
    breakoutDistance: breakoutDistance.toFixed(3),
    isValid: volumeStrong && breakoutDistance > 0.05 // Mínimo 0.05%
  };
};

// Divergence Detection - Detecta divergências entre preço e indicadores
export const detectDivergence = (prices, indicator, lookback = 5) => {
  if (prices.length < lookback || indicator.length < lookback) {
    return { bullish: false, bearish: false };
  }
  
  const recentPrices = prices.slice(-lookback);
  const recentIndicator = indicator.slice(-lookback);
  
  // Divergência de alta: preço faz mínima mais baixa, mas indicador faz mínima mais alta
  const priceLowest = Math.min(...recentPrices);
  const priceLowestIdx = recentPrices.indexOf(priceLowest);
  const indicatorAtLowest = recentIndicator[priceLowestIdx];
  const indicatorMin = Math.min(...recentIndicator);
  
  const bullishDivergence = priceLowest === recentPrices[priceLowestIdx] && 
                            indicatorAtLowest > indicatorMin;
  
  // Divergência de baixa: preço faz máxima mais alta, mas indicador faz máxima mais baixa
  const priceHighest = Math.max(...recentPrices);
  const priceHighestIdx = recentPrices.indexOf(priceHighest);
  const indicatorAtHighest = recentIndicator[priceHighestIdx];
  const indicatorMax = Math.max(...recentIndicator);
  
  const bearishDivergence = priceHighest === recentPrices[priceHighestIdx] && 
                            indicatorAtHighest < indicatorMax;
  
  return {
    bullish: bullishDivergence,
    bearish: bearishDivergence
  };
};

// Market Strength Score - Score composto de 0-100
export const calculateMarketStrength = (indicators) => {
  let score = 50; // Base neutra
  
  // RSI contribution (±15 pontos)
  if (indicators.rsi) {
    if (indicators.rsi >= 50 && indicators.rsi <= 70) {
      score += 15; // Força saudável
    } else if (indicators.rsi > 70) {
      score += 5; // Sobrecomprado
    } else if (indicators.rsi < 30) {
      score -= 15; // Sobrevenda
    } else {
      score -= 5; // Fraco
    }
  }
  
  // MACD contribution (±15 pontos)
  if (indicators.macdHistogram) {
    const hist = indicators.macdHistogram;
    if (hist > 0 && indicators.macdHistogramPrev < hist) {
      score += 15; // Momentum positivo crescente
    } else if (hist < 0 && indicators.macdHistogramPrev > hist) {
      score -= 15; // Momentum negativo crescente
    }
  }
  
  // Volume contribution (±10 pontos)
  if (indicators.volumeRatio) {
    if (indicators.volumeRatio >= 1.5) {
      score += 10; // Volume forte
    } else if (indicators.volumeRatio < 0.8) {
      score -= 10; // Volume fraco
    }
  }
  
  // OBV trend (±10 pontos)
  if (indicators.obvTrend === 'up') {
    score += 10;
  } else if (indicators.obvTrend === 'down') {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
};
