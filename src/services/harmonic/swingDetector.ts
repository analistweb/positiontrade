/**
 * Detector de swings confirmados (sem lookahead)
 * Um swing só é confirmado após N candles futuros
 * Versão melhorada: mais sensível, menos ruído
 */

import type { Candle, SwingPoint } from './types';

/**
 * Detecta swing highs confirmados
 * Um swing high é confirmado quando N candles posteriores têm highs menores
 */
export function detectSwingHighs(
  candles: Candle[],
  confirmationBars: number = 2 // Reduzido de 3 para 2
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
  confirmationBars: number = 2 // Reduzido de 3 para 2
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
  confirmationBars: number = 2 // Reduzido de 3 para 2
): SwingPoint[] {
  const highs = detectSwingHighs(candles, confirmationBars);
  const lows = detectSwingLows(candles, confirmationBars);
  
  return [...highs, ...lows].sort((a, b) => a.index - b.index);
}

/**
 * Calcula a amplitude média dos swings para filtrar ruído
 */
function calculateAverageSwingAmplitude(swings: SwingPoint[]): number {
  if (swings.length < 2) return 0;
  
  let totalAmplitude = 0;
  let count = 0;
  
  for (let i = 1; i < swings.length; i++) {
    if (swings[i].type !== swings[i - 1].type) {
      totalAmplitude += Math.abs(swings[i].price - swings[i - 1].price);
      count++;
    }
  }
  
  return count > 0 ? totalAmplitude / count : 0;
}

/**
 * Filtra swings para remover ruído (swings muito próximos ou de baixa amplitude)
 * Versão melhorada: permite swings do mesmo tipo se distantes
 */
export function filterSignificantSwings(
  swings: SwingPoint[],
  minDistance: number = 3, // Reduzido de 5 para 3
  minAmplitudeRatio: number = 0.3 // Swings devem ter pelo menos 30% da amplitude média
): SwingPoint[] {
  if (swings.length === 0) return [];
  
  const avgAmplitude = calculateAverageSwingAmplitude(swings);
  const minAmplitude = avgAmplitude * minAmplitudeRatio;
  
  const filtered: SwingPoint[] = [swings[0]];
  
  for (let i = 1; i < swings.length; i++) {
    const lastSwing = filtered[filtered.length - 1];
    const currentSwing = swings[i];
    
    // Calcula amplitude com o swing anterior
    const amplitude = Math.abs(currentSwing.price - lastSwing.price);
    
    // Se for do mesmo tipo
    if (currentSwing.type === lastSwing.type) {
      // Permite se estiver distante o suficiente (> 15 candles)
      if (currentSwing.index - lastSwing.index >= 15) {
        filtered.push(currentSwing);
        continue;
      }
      
      // Se muito próximo, mantém o mais extremo
      if (currentSwing.index - lastSwing.index < minDistance) {
        if (currentSwing.type === 'high' && currentSwing.price > lastSwing.price) {
          filtered[filtered.length - 1] = currentSwing;
        } else if (currentSwing.type === 'low' && currentSwing.price < lastSwing.price) {
          filtered[filtered.length - 1] = currentSwing;
        }
        continue;
      }
    }
    
    // Se for de tipo diferente, verifica amplitude mínima
    if (currentSwing.type !== lastSwing.type) {
      if (amplitude >= minAmplitude || minAmplitude === 0) {
        filtered.push(currentSwing);
      }
    } else {
      // Mesmo tipo, distância média - adiciona
      filtered.push(currentSwing);
    }
  }
  
  return filtered;
}

/**
 * Detecta swings com múltiplos níveis de sensibilidade
 * Retorna swings major (mais significativos) e minor (mais sensíveis)
 */
export function detectMultiLevelSwings(
  candles: Candle[]
): { major: SwingPoint[]; minor: SwingPoint[] } {
  const major = filterSignificantSwings(detectSwings(candles, 3), 8, 0.4);
  const minor = filterSignificantSwings(detectSwings(candles, 2), 3, 0.2);
  
  return { major, minor };
}
