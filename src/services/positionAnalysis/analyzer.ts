import type {
  Candle,
  AssetData,
  TrendAnalysis,
  SupportResistanceLevel,
  PositionEntry,
  RiskAnalysis,
  TechnicalIndicators,
  AnalysisResult,
  TrendLabel,
  RiskLevel,
} from './types';

// ============================================
// INDICADORES TÉCNICOS
// ============================================

export function calculateSMA(closes: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      sma.push(avg);
    }
  }
  return sma;
}

export function calculateEMA(closes: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      ema.push(closes[0]);
    } else if (i < period - 1) {
      // Usar SMA para os primeiros períodos
      const slice = closes.slice(0, i + 1);
      ema.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    } else if (i === period - 1) {
      // Primeiro EMA real é a SMA do período
      const slice = closes.slice(0, period);
      ema.push(slice.reduce((a, b) => a + b, 0) / period);
    } else {
      ema.push((closes[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  return ema;
}

export function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      rsi.push(NaN);
      continue;
    }

    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      rsi.push(NaN);
      continue;
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  return rsi;
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { line: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);
  
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }
  }
  
  const validMacd = macdLine.filter(v => !isNaN(v));
  const signalEma = calculateEMA(validMacd, signalPeriod);
  
  const signal: number[] = [];
  const histogram: number[] = [];
  let signalIdx = 0;
  
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      signal.push(NaN);
      histogram.push(NaN);
    } else {
      const sig = signalEma[signalIdx] || macdLine[i];
      signal.push(sig);
      histogram.push(macdLine[i] - sig);
      signalIdx++;
    }
  }
  
  return { line: macdLine, signal, histogram };
}

export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const tr: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
    } else {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }
  }
  
  return calculateSMA(tr, period);
}

export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): { adx: number[]; diPlus: number[]; diMinus: number[] } {
  const diPlus: number[] = [];
  const diMinus: number[] = [];
  const dx: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      diPlus.push(0);
      diMinus.push(0);
      dx.push(0);
      continue;
    }
    
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    
    diPlus.push(plusDM);
    diMinus.push(minusDM);
  }
  
  const atr = calculateATR(highs, lows, closes, period);
  const smoothDiPlus = calculateSMA(diPlus, period);
  const smoothDiMinus = calculateSMA(diMinus, period);
  
  for (let i = 0; i < highs.length; i++) {
    if (isNaN(atr[i]) || atr[i] === 0) {
      dx.push(NaN);
    } else {
      const pdi = (smoothDiPlus[i] / atr[i]) * 100;
      const mdi = (smoothDiMinus[i] / atr[i]) * 100;
      const sum = pdi + mdi;
      dx.push(sum === 0 ? 0 : (Math.abs(pdi - mdi) / sum) * 100);
    }
  }
  
  const adx = calculateSMA(dx.filter(v => !isNaN(v)), period);
  
  // Preencher ADX com NaN no início
  const fullAdx: number[] = [];
  let adxIdx = 0;
  for (let i = 0; i < highs.length; i++) {
    if (i < period * 2 - 1) {
      fullAdx.push(NaN);
    } else {
      fullAdx.push(adx[adxIdx] || NaN);
      adxIdx++;
    }
  }
  
  return { adx: fullAdx, diPlus: smoothDiPlus, diMinus: smoothDiMinus };
}

// ============================================
// DETECÇÃO DE PIVÔS (SUPORTES/RESISTÊNCIAS)
// ============================================

export function findPivotHighs(highs: number[], leftBars: number = 5, rightBars: number = 5): number[] {
  const pivots: number[] = [];
  
  for (let i = leftBars; i < highs.length - rightBars; i++) {
    let isPivot = true;
    const currentHigh = highs[i];
    
    // Verificar barras à esquerda
    for (let j = i - leftBars; j < i; j++) {
      if (highs[j] >= currentHigh) {
        isPivot = false;
        break;
      }
    }
    
    // Verificar barras à direita
    if (isPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (highs[j] > currentHigh) {
          isPivot = false;
          break;
        }
      }
    }
    
    if (isPivot) {
      pivots.push(currentHigh);
    }
  }
  
  return pivots;
}

export function findPivotLows(lows: number[], leftBars: number = 5, rightBars: number = 5): number[] {
  const pivots: number[] = [];
  
  for (let i = leftBars; i < lows.length - rightBars; i++) {
    let isPivot = true;
    const currentLow = lows[i];
    
    for (let j = i - leftBars; j < i; j++) {
      if (lows[j] <= currentLow) {
        isPivot = false;
        break;
      }
    }
    
    if (isPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (lows[j] < currentLow) {
          isPivot = false;
          break;
        }
      }
    }
    
    if (isPivot) {
      pivots.push(currentLow);
    }
  }
  
  return pivots;
}

export function calculateFibonacciLevels(high: number, low: number): number[] {
  const diff = high - low;
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
  return levels.map(level => low + diff * level);
}

// ============================================
// ANÁLISE DE TENDÊNCIA
// ============================================

export function analyzeTrend(
  closes: number[],
  sma50: number[],
  sma200: number[]
): TrendAnalysis {
  const currentPrice = closes[closes.length - 1];
  const currentSma50 = sma50[sma50.length - 1];
  const currentSma200 = sma200[sma200.length - 1];
  
  const sma50AboveSma200 = currentSma50 > currentSma200;
  const priceAboveSma200 = currentPrice > currentSma200;
  const priceAboveSma50 = currentPrice > currentSma50;
  
  // Calcular slope da SMA200 (últimos 20 períodos)
  const sma200Recent = sma200.slice(-20).filter(v => !isNaN(v));
  const slope = sma200Recent.length > 1 
    ? (sma200Recent[sma200Recent.length - 1] - sma200Recent[0]) / sma200Recent[0] * 100
    : 0;
  
  let label: TrendLabel;
  let justificativa: string;
  let strength: number;
  
  if (sma50AboveSma200 && priceAboveSma200 && priceAboveSma50) {
    label = 'Alta';
    strength = Math.min(100, 60 + Math.abs(slope) * 10);
    justificativa = `SMA50 acima da SMA200, preço ${((currentPrice / currentSma200 - 1) * 100).toFixed(1)}% acima da média de 200 períodos`;
  } else if (!sma50AboveSma200 && !priceAboveSma200 && !priceAboveSma50) {
    label = 'Baixa';
    strength = Math.min(100, 60 + Math.abs(slope) * 10);
    justificativa = `SMA50 abaixo da SMA200, preço ${((1 - currentPrice / currentSma200) * 100).toFixed(1)}% abaixo da média de 200 períodos`;
  } else {
    label = 'Lateral';
    strength = Math.max(0, 50 - Math.abs(slope) * 10);
    justificativa = `Preço oscilando entre médias móveis, sem tendência definida`;
  }
  
  return {
    label,
    justificativa,
    strength,
    sma50AboveSma200,
    priceAboveSma200,
  };
}

// ============================================
// SUPORTES E RESISTÊNCIAS
// ============================================

export function detectSupportResistance(
  highs: number[],
  lows: number[],
  closes: number[],
  sma50: number[],
  sma200: number[]
): SupportResistanceLevel[] {
  const levels: SupportResistanceLevel[] = [];
  const currentPrice = closes[closes.length - 1];
  
  // Pivôs como suportes/resistências
  const pivotHighs = findPivotHighs(highs, 10, 10);
  const pivotLows = findPivotLows(lows, 10, 10);
  
  // Agrupar pivôs próximos (dentro de 2% de diferença)
  const groupLevels = (values: number[]): number[] => {
    const grouped: number[] = [];
    const sorted = [...values].sort((a, b) => a - b);
    
    for (const val of sorted) {
      const existing = grouped.find(g => Math.abs(g - val) / g < 0.02);
      if (!existing) {
        grouped.push(val);
      }
    }
    return grouped;
  };
  
  const groupedHighs = groupLevels(pivotHighs);
  const groupedLows = groupLevels(pivotLows);
  
  // Adicionar resistências (pivôs altos acima do preço atual)
  for (const high of groupedHighs) {
    if (high > currentPrice) {
      const occurrences = pivotHighs.filter(p => Math.abs(p - high) / high < 0.02).length;
      levels.push({
        price: high,
        type: 'resistência',
        strength: occurrences >= 3 ? 'forte' : occurrences >= 2 ? 'média' : 'fraca',
        origin: 'pivô',
      });
    }
  }
  
  // Adicionar suportes (pivôs baixos abaixo do preço atual)
  for (const low of groupedLows) {
    if (low < currentPrice) {
      const occurrences = pivotLows.filter(p => Math.abs(p - low) / low < 0.02).length;
      levels.push({
        price: low,
        type: 'suporte',
        strength: occurrences >= 3 ? 'forte' : occurrences >= 2 ? 'média' : 'fraca',
        origin: 'pivô',
      });
    }
  }
  
  // Médias móveis como suporte/resistência
  const currentSma50 = sma50[sma50.length - 1];
  const currentSma200 = sma200[sma200.length - 1];
  
  if (!isNaN(currentSma50)) {
    levels.push({
      price: currentSma50,
      type: currentSma50 < currentPrice ? 'suporte' : 'resistência',
      strength: 'média',
      origin: 'média móvel',
    });
  }
  
  if (!isNaN(currentSma200)) {
    levels.push({
      price: currentSma200,
      type: currentSma200 < currentPrice ? 'suporte' : 'resistência',
      strength: 'forte',
      origin: 'média móvel',
    });
  }
  
  // Fibonacci do último swing
  const recentHigh = Math.max(...highs.slice(-60));
  const recentLow = Math.min(...lows.slice(-60));
  const fiboLevels = calculateFibonacciLevels(recentHigh, recentLow);
  
  const fiboNames = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%', '127.2%', '161.8%'];
  for (let i = 0; i < fiboLevels.length; i++) {
    const level = fiboLevels[i];
    if (Math.abs(level - currentPrice) / currentPrice > 0.01) { // Ignorar níveis muito próximos
      levels.push({
        price: level,
        type: level < currentPrice ? 'suporte' : 'resistência',
        strength: [3, 4, 5].includes(i) ? 'média' : 'fraca', // 38.2%, 50%, 61.8% são mais fortes
        origin: 'fibonacci',
      });
    }
  }
  
  // Ordenar por distância do preço atual e remover duplicatas
  const uniqueLevels = levels.filter((level, index, self) =>
    index === self.findIndex(l => Math.abs(l.price - level.price) / level.price < 0.01)
  );
  
  return uniqueLevels
    .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))
    .slice(0, 10); // Manter os 10 níveis mais relevantes
}

// ============================================
// PONTOS DE ENTRADA
// ============================================

export function findPositionEntries(
  closes: number[],
  highs: number[],
  lows: number[],
  sma200: number[],
  rsi: number[],
  trend: TrendAnalysis,
  supports: SupportResistanceLevel[]
): PositionEntry[] {
  const entries: PositionEntry[] = [];
  const currentPrice = closes[closes.length - 1];
  const currentSma200 = sma200[sma200.length - 1];
  const currentRsi = rsi[rsi.length - 1];
  
  // Filtrar apenas suportes
  const supportLevels = supports.filter(s => s.type === 'suporte');
  const resistanceLevels = supports.filter(s => s.type === 'resistência');
  
  // Calcular ATR para stop dinâmico
  const atr = calculateATR(highs, lows, closes, 14);
  const currentAtr = atr[atr.length - 1] || currentPrice * 0.02;
  
  if (trend.label === 'Alta') {
    // 1. Pullback à SMA200
    if (currentPrice < currentSma200 * 1.05 && currentPrice > currentSma200 * 0.98) {
      const nearestSupport = supportLevels.find(s => s.price < currentSma200);
      const stopPrice = nearestSupport?.price || currentSma200 - currentAtr * 2;
      const targetPrice = resistanceLevels[0]?.price || currentPrice * 1.15;
      const risk = currentPrice - stopPrice;
      const reward = targetPrice - currentPrice;
      
      entries.push({
        tipo: 'pullback',
        preco: currentSma200,
        stop: stopPrice,
        alvo: targetPrice,
        racional: 'Pullback à média de 200 períodos em tendência de alta. Entrada conservadora com suporte técnico.',
        rr: reward / risk,
      });
    }
    
    // 2. Rompimento de resistência
    const nearestResistance = resistanceLevels[0];
    if (nearestResistance && nearestResistance.price < currentPrice * 1.05) {
      const stopPrice = currentPrice - currentAtr * 2;
      const targetPrice = currentPrice * 1.10;
      const risk = currentPrice - stopPrice;
      const reward = targetPrice - currentPrice;
      
      entries.push({
        tipo: 'rompimento',
        preco: nearestResistance.price,
        stop: stopPrice,
        alvo: targetPrice,
        racional: `Rompimento da resistência em ${nearestResistance.price.toFixed(2)} com continuação da tendência de alta.`,
        rr: reward / risk,
      });
    }
  } else if (trend.label === 'Lateral' && currentRsi < 40) {
    // Compra em sobrevenda durante lateralização
    const nearestSupport = supportLevels[0];
    if (nearestSupport && currentPrice < nearestSupport.price * 1.03) {
      const stopPrice = nearestSupport.price - currentAtr * 1.5;
      const targetPrice = resistanceLevels[0]?.price || currentPrice * 1.08;
      const risk = currentPrice - stopPrice;
      const reward = targetPrice - currentPrice;
      
      entries.push({
        tipo: 'reteste',
        preco: nearestSupport.price,
        stop: stopPrice,
        alvo: targetPrice,
        racional: `Reteste do suporte em ${nearestSupport.price.toFixed(2)} com RSI em sobrevenda (${currentRsi.toFixed(0)}). Jogo de range.`,
        rr: reward / risk,
      });
    }
  }
  
  // Filtrar entradas com R:R >= 1.5
  return entries.filter(e => e.rr >= 1.5).slice(0, 3);
}

// ============================================
// ANÁLISE DE RISCO
// ============================================

export function analyzeRisk(
  closes: number[],
  sma50: number[],
  sma200: number[],
  rsi: number[],
  atr: number[],
  supports: SupportResistanceLevel[]
): RiskAnalysis {
  const sinais: string[] = [];
  let score = 0;
  
  const currentSma50 = sma50[sma50.length - 1];
  const currentSma200 = sma200[sma200.length - 1];
  const prevSma50 = sma50[sma50.length - 20];
  const prevSma200 = sma200[sma200.length - 20];
  const currentPrice = closes[closes.length - 1];
  
  // 1. Death Cross (peso: 30)
  const deathCross = currentSma50 < currentSma200 && prevSma50 > prevSma200;
  if (deathCross) {
    sinais.push('Death Cross detectado (SMA50 cruzou abaixo da SMA200)');
    score += 30;
  } else if (currentSma50 < currentSma200) {
    sinais.push('SMA50 abaixo da SMA200 (estrutura de baixa)');
    score += 15;
  }
  
  // 2. Divergência de baixa no RSI (peso: 20)
  const recentHighs = closes.slice(-30);
  const recentRsi = rsi.slice(-30);
  const priceHigh1 = Math.max(...recentHighs.slice(0, 15));
  const priceHigh2 = Math.max(...recentHighs.slice(15));
  const rsiHigh1 = Math.max(...recentRsi.slice(0, 15).filter(v => !isNaN(v)));
  const rsiHigh2 = Math.max(...recentRsi.slice(15).filter(v => !isNaN(v)));
  
  const rsiBearishDivergence = priceHigh2 > priceHigh1 && rsiHigh2 < rsiHigh1;
  if (rsiBearishDivergence) {
    sinais.push('Divergência de baixa no RSI (preços subindo, RSI caindo)');
    score += 20;
  }
  
  // 3. ATR crescente (volatilidade aumentando) (peso: 15)
  const atrRecent = atr.slice(-20).filter(v => !isNaN(v));
  const atrOld = atr.slice(-40, -20).filter(v => !isNaN(v));
  const avgAtrRecent = atrRecent.reduce((a, b) => a + b, 0) / atrRecent.length;
  const avgAtrOld = atrOld.reduce((a, b) => a + b, 0) / atrOld.length;
  
  const atrIncreasing = avgAtrRecent > avgAtrOld * 1.3;
  if (atrIncreasing) {
    sinais.push('Volatilidade (ATR) aumentando significativamente');
    score += 15;
  }
  
  // 4. Rompimento de suporte (peso: 25)
  const strongSupports = supports.filter(s => s.type === 'suporte' && s.strength === 'forte');
  const supportBreak = strongSupports.some(s => currentPrice < s.price * 0.98);
  if (supportBreak) {
    sinais.push('Rompimento de suporte forte detectado');
    score += 25;
  }
  
  // 5. RSI em sobrecompra extrema (peso: 10)
  const currentRsi = rsi[rsi.length - 1];
  if (currentRsi > 80) {
    sinais.push(`RSI em sobrecompra extrema (${currentRsi.toFixed(0)})`);
    score += 10;
  }
  
  // Determinar nível de risco
  let nivel: RiskLevel;
  if (score >= 60) {
    nivel = 'crítico';
  } else if (score >= 40) {
    nivel = 'alto';
  } else if (score >= 20) {
    nivel = 'médio';
  } else {
    nivel = 'baixo';
  }
  
  if (sinais.length === 0) {
    sinais.push('Nenhum sinal de risco significativo detectado');
  }
  
  return {
    score: Math.min(100, score),
    sinais,
    nivel,
    deathCross,
    rsiBearishDivergence,
    atrIncreasing,
    supportBreak,
  };
}

// ============================================
// GERADOR DE RESUMO
// ============================================

function generateSummary(
  ticker: string,
  currentPrice: number,
  currency: string,
  trend: TrendAnalysis,
  supports: SupportResistanceLevel[],
  entries: PositionEntry[],
  risk: RiskAnalysis
): string {
  const formatPrice = (price: number) => {
    const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;
    return `${currencySymbol}${price.toFixed(2)}`;
  };
  
  const supportLevels = supports.filter(s => s.type === 'suporte').slice(0, 2);
  const resistanceLevels = supports.filter(s => s.type === 'resistência').slice(0, 2);
  
  let summary = `${ticker} está em TENDÊNCIA DE ${trend.label.toUpperCase()}. `;
  summary += trend.justificativa + '. ';
  
  if (supportLevels.length > 0) {
    summary += `Principais suportes em ${supportLevels.map(s => formatPrice(s.price)).join(' e ')}. `;
  }
  
  if (resistanceLevels.length > 0) {
    summary += `Resistência imediata em ${resistanceLevels.map(s => formatPrice(s.price)).join(' e ')}. `;
  }
  
  if (entries.length > 0) {
    const bestEntry = entries[0];
    summary += `Para position trade, considerar entrada em ${bestEntry.tipo} para ${formatPrice(bestEntry.preco)} `;
    summary += `com stop em ${formatPrice(bestEntry.stop)} (R:R ${bestEntry.rr.toFixed(1)}). `;
  }
  
  summary += `Risco de queda ${risk.nivel.toUpperCase()} (${risk.score}/100)`;
  if (risk.sinais.length > 0 && risk.score > 0) {
    summary += `: ${risk.sinais[0].toLowerCase()}`;
  }
  summary += '.';
  
  return summary;
}

// ============================================
// FUNÇÃO PRINCIPAL DE ANÁLISE
// ============================================

export function analyzeAsset(data: AssetData): AnalysisResult {
  const { candles, ticker, name, currency, currentPrice, change24h, changePercent24h } = data;
  
  // Extrair arrays
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Calcular indicadores
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const atr = calculateATR(highs, lows, closes, 14);
  const adxResult = calculateADX(highs, lows, closes, 14);
  
  // Valores atuais
  const currentSma50 = sma50[sma50.length - 1];
  const currentSma200 = sma200[sma200.length - 1];
  const currentRsi = rsi[rsi.length - 1];
  const currentMacdLine = macd.line[macd.line.length - 1];
  const currentMacdSignal = macd.signal[macd.signal.length - 1];
  const currentMacdHistogram = macd.histogram[macd.histogram.length - 1];
  const currentAtr = atr[atr.length - 1];
  const currentAdx = adxResult.adx[adxResult.adx.length - 1];
  
  // Análises
  const trend = analyzeTrend(closes, sma50, sma200);
  const supports = detectSupportResistance(highs, lows, closes, sma50, sma200);
  const entries = findPositionEntries(closes, highs, lows, sma200, rsi, trend, supports);
  const risk = analyzeRisk(closes, sma50, sma200, rsi, atr, supports);
  
  // Indicadores formatados
  const indicadores: TechnicalIndicators = {
    sma50: currentSma50,
    sma200: currentSma200,
    rsi: currentRsi,
    macd: {
      line: currentMacdLine,
      signal: currentMacdSignal,
      histogram: currentMacdHistogram,
    },
    atr: currentAtr,
    atrPercent: (currentAtr / currentPrice) * 100,
    adx: currentAdx,
  };
  
  // Gerar resumo
  const resumo = generateSummary(ticker, currentPrice, currency, trend, supports, entries, risk);
  
  return {
    ticker,
    name,
    currency,
    currentPrice,
    change24h,
    changePercent24h,
    tendencia: trend,
    suportesResistencias: supports,
    positionTrade: entries,
    indicadores,
    risco: risk,
    resumo,
    candles,
    sma50Series: sma50,
    sma200Series: sma200,
    analyzedAt: new Date().toISOString(),
  };
}
