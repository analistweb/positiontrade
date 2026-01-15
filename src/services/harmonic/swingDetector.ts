/**
 * Detector de swings confirmados (sem lookahead)
 * Um swing só é confirmado após N candles futuros
 */

import type { Candle, SwingPoint } from './types';

/**
 * Detecta swing highs confirmados
 * Um swing high é confirmado quando N candles posteriores têm highs menores
 */
export function detectSwingHighs(
  candles: Candle[],
  confirmationBars: number = 3
): SwingPoint[] {
  const swings: SwingPoint[] = [];
  
  for (let i = confirmationBars; i < candles.length - confirmationBars; i++) {
    const currentHigh = candles[i].high;
    let isSwingHigh = true;
    
    // Verifica N candles anteriores
    for (let j = 1; j <= confirmationBars; j++) {
      if (candles[i - j].high >= currentHigh) {
        isSwingHigh = false;
        break;
      }
    }
    
    // Verifica N candles posteriores (confirmação)
    if (isSwingHigh) {
      for (let j = 1; j <= confirmationBars; j++) {
        if (candles[i + j].high >= currentHigh) {
          isSwingHigh = false;
          break;
        }
      }
    }
    
    if (isSwingHigh) {
      swings.push({
        index: i,
        timestamp: candles[i].timestamp,
        price: currentHigh,
        type: 'high',
        confirmed: true
      });
    }
  }
  
  return swings;
}

/**
 * Detecta swing lows confirmados
 * Um swing low é confirmado quando N candles posteriores têm lows maiores
 */
export function detectSwingLows(
  candles: Candle[],
  confirmationBars: number = 3
): SwingPoint[] {
  const swings: SwingPoint[] = [];
  
  for (let i = confirmationBars; i < candles.length - confirmationBars; i++) {
    const currentLow = candles[i].low;
    let isSwingLow = true;
    
    // Verifica N candles anteriores
    for (let j = 1; j <= confirmationBars; j++) {
      if (candles[i - j].low <= currentLow) {
        isSwingLow = false;
        break;
      }
    }
    
    // Verifica N candles posteriores (confirmação)
    if (isSwingLow) {
      for (let j = 1; j <= confirmationBars; j++) {
        if (candles[i + j].low <= currentLow) {
          isSwingLow = false;
          break;
        }
      }
    }
    
    if (isSwingLow) {
      swings.push({
        index: i,
        timestamp: candles[i].timestamp,
        price: currentLow,
        type: 'low',
        confirmed: true
      });
    }
  }
  
  return swings;
}

/**
 * Combina e ordena todos os swings por índice
 */
export function detectSwings(
  candles: Candle[],
  confirmationBars: number = 3
): SwingPoint[] {
  const highs = detectSwingHighs(candles, confirmationBars);
  const lows = detectSwingLows(candles, confirmationBars);
  
  return [...highs, ...lows].sort((a, b) => a.index - b.index);
}

/**
 * Filtra swings para remover ruído (swings muito próximos)
 */
export function filterSignificantSwings(
  swings: SwingPoint[],
  minDistance: number = 5
): SwingPoint[] {
  if (swings.length === 0) return [];
  
  const filtered: SwingPoint[] = [swings[0]];
  
  for (let i = 1; i < swings.length; i++) {
    const lastSwing = filtered[filtered.length - 1];
    const currentSwing = swings[i];
    
    // Se for do mesmo tipo e muito próximo, mantém o mais extremo
    if (currentSwing.type === lastSwing.type) {
      if (currentSwing.index - lastSwing.index < minDistance) {
        if (currentSwing.type === 'high' && currentSwing.price > lastSwing.price) {
          filtered[filtered.length - 1] = currentSwing;
        } else if (currentSwing.type === 'low' && currentSwing.price < lastSwing.price) {
          filtered[filtered.length - 1] = currentSwing;
        }
        continue;
      }
    }
    
    filtered.push(currentSwing);
  }
  
  return filtered;
}
