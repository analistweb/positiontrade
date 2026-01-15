/**
 * Gestão de risco para estratégia harmônica
 * SL = D ± max(1.2×ATR(14), distância até último swing)
 * Risco fixo: 1% do capital inicial
 */

import type { Candle, HarmonicPattern, Trade, BacktestConfig } from './types';

/**
 * Calcula ATR (Average True Range)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const atr: number[] = [];
  const tr: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trueRange);
    
    if (tr.length >= period) {
      const sum = tr.slice(-period).reduce((a, b) => a + b, 0);
      atr.push(sum / period);
    }
  }
  
  return atr;
}

/**
 * Calcula Stop Loss para o padrão
 */
export function calculateStopLoss(
  pattern: HarmonicPattern,
  candles: Candle[],
  lastSwingPrice: number
): number {
  const D = pattern.points.D;
  const atrValues = calculateATR(candles.slice(0, D.index + 1));
  const currentATR = atrValues[atrValues.length - 1] || 0;
  
  const atrBuffer = currentATR * 1.2;
  const swingDistance = Math.abs(D.price - lastSwingPrice);
  const slDistance = Math.max(atrBuffer, swingDistance);
  
  if (pattern.type === 'bullish') {
    return D.price - slDistance;
  } else {
    return D.price + slDistance;
  }
}

/**
 * Calcula Take Profits baseados em projeção AD
 * TP1: 38.2% de AD
 * TP2: 61.8% de AD
 */
export function calculateTakeProfits(
  pattern: HarmonicPattern
): { tp1: number; tp2: number } {
  const A = pattern.points.A.price;
  const D = pattern.points.D.price;
  const AD = Math.abs(A - D);
  
  if (pattern.type === 'bullish') {
    return {
      tp1: D + AD * 0.382,
      tp2: D + AD * 0.618
    };
  } else {
    return {
      tp1: D - AD * 0.382,
      tp2: D - AD * 0.618
    };
  }
}

/**
 * Calcula tamanho da posição baseado no risco
 */
export function calculatePositionSize(
  capital: number,
  entryPrice: number,
  stopLoss: number,
  riskPercent: number
): number {
  const riskAmount = capital * riskPercent;
  const stopDistance = Math.abs(entryPrice - stopLoss);
  
  if (stopDistance === 0) return 0;
  
  // Retorna quantidade de unidades do ativo
  return riskAmount / stopDistance;
}

/**
 * Atualiza trailing stop baseado em novos swings
 */
export function updateTrailingStop(
  currentStop: number,
  newSwingPrice: number,
  pattern: HarmonicPattern,
  atr: number
): number {
  if (pattern.type === 'bullish') {
    // Trailing sobe com novos swing lows confirmados
    const newStop = newSwingPrice - atr * 0.5;
    return Math.max(currentStop, newStop);
  } else {
    // Trailing desce com novos swing highs confirmados
    const newStop = newSwingPrice + atr * 0.5;
    return Math.min(currentStop, newStop);
  }
}

/**
 * Gerencia saídas parciais
 * 50% em TP1, 30% em TP2, trailing stop para resto
 */
export function manageExits(
  entryPrice: number,
  currentPrice: number,
  stopLoss: number,
  tp1: number,
  tp2: number,
  trailingStop: number,
  pattern: HarmonicPattern,
  positionRemaining: number // 1.0 = 100%, 0.5 = 50%, etc.
): { 
  action: 'hold' | 'partial_tp1' | 'partial_tp2' | 'trailing_exit' | 'stop_loss';
  exitPercent: number;
  exitPrice: number;
} {
  const isBullish = pattern.type === 'bullish';
  
  // Stop Loss
  if (isBullish && currentPrice <= stopLoss) {
    return { action: 'stop_loss', exitPercent: positionRemaining, exitPrice: stopLoss };
  }
  if (!isBullish && currentPrice >= stopLoss) {
    return { action: 'stop_loss', exitPercent: positionRemaining, exitPrice: stopLoss };
  }
  
  // Trailing Stop
  if (isBullish && currentPrice <= trailingStop && trailingStop > stopLoss) {
    return { action: 'trailing_exit', exitPercent: positionRemaining, exitPrice: trailingStop };
  }
  if (!isBullish && currentPrice >= trailingStop && trailingStop < stopLoss) {
    return { action: 'trailing_exit', exitPercent: positionRemaining, exitPrice: trailingStop };
  }
  
  // TP1: 50% da posição
  if (positionRemaining > 0.5) {
    if (isBullish && currentPrice >= tp1) {
      return { action: 'partial_tp1', exitPercent: 0.5, exitPrice: tp1 };
    }
    if (!isBullish && currentPrice <= tp1) {
      return { action: 'partial_tp1', exitPercent: 0.5, exitPrice: tp1 };
    }
  }
  
  // TP2: 30% da posição
  if (positionRemaining > 0.2 && positionRemaining <= 0.5) {
    if (isBullish && currentPrice >= tp2) {
      return { action: 'partial_tp2', exitPercent: 0.3, exitPrice: tp2 };
    }
    if (!isBullish && currentPrice <= tp2) {
      return { action: 'partial_tp2', exitPercent: 0.3, exitPrice: tp2 };
    }
  }
  
  return { action: 'hold', exitPercent: 0, exitPrice: currentPrice };
}

/**
 * Calcula Kelly Fraction conservador
 * Usa 25% do Kelly ótimo, limitado a 1% por trade
 */
export function calculateKellyFraction(
  winRate: number,
  avgWin: number,
  avgLoss: number
): number {
  if (avgLoss === 0) return 0;
  
  const winLossRatio = avgWin / avgLoss;
  
  // Kelly = W - (1-W)/R
  // Onde W = win rate, R = win/loss ratio
  const kelly = winRate - ((1 - winRate) / winLossRatio);
  
  // Usa 25% do Kelly (conservador)
  const conservativeKelly = kelly * 0.25;
  
  // Limita a 1% máximo por trade
  return Math.min(Math.max(conservativeKelly, 0), 0.01);
}
