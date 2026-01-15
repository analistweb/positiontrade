/**
 * Detector de padrões harmônicos XABCD
 * Valida geometria e simetria temporal
 */

import type { SwingPoint, HarmonicPattern, Candle } from './types';

// Tolerâncias para ratios de Fibonacci
const RATIO_TOLERANCE = 0.05;

interface GeometryRules {
  AB_XA: [number, number]; // [min, max]
  BC_AB: [number, number];
  CD_BC: [number, number];
  D_XA: [number, number];
}

// Regras específicas do prompt
const HARMONIC_RULES: GeometryRules = {
  AB_XA: [0.382, 0.618],
  BC_AB: [0.618, 0.786],
  CD_BC: [1.27, 1.618],
  D_XA: [0.766, 0.806]
};

/**
 * Calcula ratio entre duas pernas
 */
function calculateRatio(leg1Start: number, leg1End: number, leg2Start: number, leg2End: number): number {
  const leg1 = Math.abs(leg1End - leg1Start);
  const leg2 = Math.abs(leg2End - leg2Start);
  return leg1 === 0 ? 0 : leg2 / leg1;
}

/**
 * Verifica se um ratio está dentro dos limites
 */
function isRatioValid(ratio: number, limits: [number, number], tolerance: number = RATIO_TOLERANCE): boolean {
  return ratio >= (limits[0] - tolerance) && ratio <= (limits[1] + tolerance);
}

/**
 * Valida geometria do padrão XABCD
 */
export function validateGeometry(
  X: SwingPoint,
  A: SwingPoint,
  B: SwingPoint,
  C: SwingPoint,
  D: SwingPoint
): { valid: boolean; ratios: HarmonicPattern['ratios'] } {
  // AB deve ser [38.2%-61.8%] de XA
  const AB_XA = calculateRatio(X.price, A.price, A.price, B.price);
  
  // BC deve ser [61.8%-78.6%] de AB
  const BC_AB = calculateRatio(A.price, B.price, B.price, C.price);
  
  // CD deve ser [127%-161.8%] de BC
  const CD_BC = calculateRatio(B.price, C.price, C.price, D.price);
  
  // D deve estar em [76.6%-80.6%] de XA
  const XA = Math.abs(A.price - X.price);
  const XD = Math.abs(D.price - X.price);
  const D_XA = XA === 0 ? 0 : XD / XA;
  
  const ratios = { AB_XA, BC_AB, CD_BC, D_XA };
  
  const valid = 
    isRatioValid(AB_XA, HARMONIC_RULES.AB_XA) &&
    isRatioValid(BC_AB, HARMONIC_RULES.BC_AB) &&
    isRatioValid(CD_BC, HARMONIC_RULES.CD_BC) &&
    isRatioValid(D_XA, HARMONIC_RULES.D_XA);
  
  return { valid, ratios };
}

/**
 * Valida simetria temporal do padrão
 * CD ≤ 2×AB, BC ≥ 0.5×AB
 */
export function validateTemporalSymmetry(
  A: SwingPoint,
  B: SwingPoint,
  C: SwingPoint,
  D: SwingPoint
): { valid: boolean; CD_AB_ratio: number; BC_AB_ratio: number } {
  const AB_duration = B.index - A.index;
  const BC_duration = C.index - B.index;
  const CD_duration = D.index - C.index;
  
  const CD_AB_ratio = AB_duration === 0 ? 0 : CD_duration / AB_duration;
  const BC_AB_ratio = AB_duration === 0 ? 0 : BC_duration / AB_duration;
  
  // CD ≤ 2×AB e BC ≥ 0.5×AB
  const valid = CD_AB_ratio <= 2 && BC_AB_ratio >= 0.5;
  
  return { valid, CD_AB_ratio, BC_AB_ratio };
}

/**
 * Identifica padrões harmônicos em uma sequência de swings
 */
export function identifyHarmonicPatterns(
  swings: SwingPoint[],
  candles: Candle[]
): HarmonicPattern[] {
  const patterns: HarmonicPattern[] = [];
  
  // Precisamos de pelo menos 5 swings para formar um padrão XABCD
  if (swings.length < 5) return patterns;
  
  // Itera sobre possíveis combinações de 5 swings consecutivos
  for (let i = 0; i <= swings.length - 5; i++) {
    const X = swings[i];
    const A = swings[i + 1];
    const B = swings[i + 2];
    const C = swings[i + 3];
    const D = swings[i + 4];
    
    // Verifica se os tipos alternam corretamente
    // Bullish: X(low) -> A(high) -> B(low) -> C(high) -> D(low)
    // Bearish: X(high) -> A(low) -> B(high) -> C(low) -> D(high)
    
    const isBullish = 
      X.type === 'low' && A.type === 'high' && 
      B.type === 'low' && C.type === 'high' && D.type === 'low';
    
    const isBearish = 
      X.type === 'high' && A.type === 'low' && 
      B.type === 'high' && C.type === 'low' && D.type === 'high';
    
    if (!isBullish && !isBearish) continue;
    
    // Valida geometria
    const geometry = validateGeometry(X, A, B, C, D);
    if (!geometry.valid) continue;
    
    // Valida simetria temporal
    const temporal = validateTemporalSymmetry(A, B, C, D);
    if (!temporal.valid) continue;
    
    // Encontra o candle de confirmação (candle que fecha após D)
    const confirmationCandle = candles[D.index + 1];
    
    patterns.push({
      id: `${D.timestamp}_${isBullish ? 'bull' : 'bear'}`,
      type: isBullish ? 'bullish' : 'bearish',
      patternName: 'Generic', // Poderia classificar como Gartley, Bat, etc.
      points: { X, A, B, C, D },
      ratios: geometry.ratios,
      temporalSymmetry: {
        CD_AB_ratio: temporal.CD_AB_ratio,
        BC_AB_ratio: temporal.BC_AB_ratio,
        valid: temporal.valid
      },
      valid: true,
      confirmationCandle
    });
  }
  
  return patterns;
}

/**
 * Classifica o padrão harmônico com base nos ratios
 */
export function classifyPattern(ratios: HarmonicPattern['ratios']): HarmonicPattern['patternName'] {
  // Gartley: AB = 61.8% XA, D = 78.6% XA
  if (ratios.AB_XA >= 0.58 && ratios.AB_XA <= 0.65 && ratios.D_XA >= 0.76 && ratios.D_XA <= 0.79) {
    return 'Gartley';
  }
  
  // Bat: AB = 38.2-50% XA, D = 88.6% XA
  if (ratios.AB_XA >= 0.36 && ratios.AB_XA <= 0.52 && ratios.D_XA >= 0.85 && ratios.D_XA <= 0.90) {
    return 'Bat';
  }
  
  // Butterfly: AB = 78.6% XA, D = 127% XA
  if (ratios.AB_XA >= 0.76 && ratios.AB_XA <= 0.82 && ratios.D_XA >= 1.24 && ratios.D_XA <= 1.30) {
    return 'Butterfly';
  }
  
  // Crab: AB = 38.2-61.8% XA, D = 161.8% XA
  if (ratios.AB_XA >= 0.36 && ratios.AB_XA <= 0.64 && ratios.D_XA >= 1.58 && ratios.D_XA <= 1.65) {
    return 'Crab';
  }
  
  return 'Generic';
}
