/**
 * Detector de padrões harmônicos XABCD
 * Valida geometria e simetria temporal
 * Suporta múltiplos tipos: Gartley, Bat, Butterfly, Crab
 */

import type { SwingPoint, HarmonicPattern, Candle } from './types';

// Tolerância expandida para ratios de Fibonacci
const RATIO_TOLERANCE = 0.10; // Aumentado de 0.05 para 0.10

interface PatternRules {
  name: HarmonicPattern['patternName'];
  AB_XA: [number, number];
  BC_AB: [number, number];
  CD_BC: [number, number];
  D_XA: [number, number];
}

// Regras para múltiplos padrões harmônicos (com tolerância incluída)
const HARMONIC_PATTERNS: PatternRules[] = [
  {
    name: 'Gartley',
    AB_XA: [0.55, 0.68], // 61.8% nominal
    BC_AB: [0.38, 0.89], // 38.2-88.6%
    CD_BC: [1.13, 1.62], // 113-161.8%
    D_XA: [0.73, 0.83]   // 78.6% nominal
  },
  {
    name: 'Bat',
    AB_XA: [0.32, 0.55], // 38.2-50%
    BC_AB: [0.38, 0.89], // 38.2-88.6%
    CD_BC: [1.62, 2.62], // 161.8-261.8%
    D_XA: [0.82, 0.92]   // 88.6% nominal
  },
  {
    name: 'Butterfly',
    AB_XA: [0.73, 0.82], // 78.6% nominal
    BC_AB: [0.38, 0.89], // 38.2-88.6%
    CD_BC: [1.62, 2.24], // 161.8-224%
    D_XA: [1.22, 1.42]   // 127% nominal (extensão)
  },
  {
    name: 'Crab',
    AB_XA: [0.32, 0.68], // 38.2-61.8%
    BC_AB: [0.38, 0.89], // 38.2-88.6%
    CD_BC: [2.24, 3.62], // 224-361.8%
    D_XA: [1.56, 1.68]   // 161.8% nominal (extensão)
  }
];

// Regras genéricas mais relaxadas
const GENERIC_RULES: PatternRules = {
  name: 'Generic',
  AB_XA: [0.30, 0.85],  // Muito amplo
  BC_AB: [0.30, 1.00],  // Muito amplo
  CD_BC: [0.80, 4.00],  // Muito amplo
  D_XA: [0.50, 1.80]    // Muito amplo
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
 * Valida geometria do padrão XABCD contra regras específicas
 */
export function validateGeometry(
  X: SwingPoint,
  A: SwingPoint,
  B: SwingPoint,
  C: SwingPoint,
  D: SwingPoint,
  rules: PatternRules = GENERIC_RULES
): { valid: boolean; ratios: HarmonicPattern['ratios'] } {
  // AB deve ser uma fração de XA
  const AB_XA = calculateRatio(X.price, A.price, A.price, B.price);
  
  // BC deve ser uma fração de AB
  const BC_AB = calculateRatio(A.price, B.price, B.price, C.price);
  
  // CD deve ser uma extensão de BC
  const CD_BC = calculateRatio(B.price, C.price, C.price, D.price);
  
  // D deve estar em uma fração de XA
  const XA = Math.abs(A.price - X.price);
  const XD = Math.abs(D.price - X.price);
  const D_XA = XA === 0 ? 0 : XD / XA;
  
  const ratios = { AB_XA, BC_AB, CD_BC, D_XA };
  
  const valid = 
    isRatioValid(AB_XA, rules.AB_XA) &&
    isRatioValid(BC_AB, rules.BC_AB) &&
    isRatioValid(CD_BC, rules.CD_BC) &&
    isRatioValid(D_XA, rules.D_XA);
  
  return { valid, ratios };
}

/**
 * Encontra qual padrão específico se encaixa melhor
 */
function findMatchingPattern(
  X: SwingPoint,
  A: SwingPoint,
  B: SwingPoint,
  C: SwingPoint,
  D: SwingPoint
): { patternName: HarmonicPattern['patternName']; ratios: HarmonicPattern['ratios'] } | null {
  // Tenta padrões específicos primeiro
  for (const pattern of HARMONIC_PATTERNS) {
    const result = validateGeometry(X, A, B, C, D, pattern);
    if (result.valid) {
      return { patternName: pattern.name, ratios: result.ratios };
    }
  }
  
  // Se nenhum específico, tenta genérico
  const genericResult = validateGeometry(X, A, B, C, D, GENERIC_RULES);
  if (genericResult.valid) {
    return { patternName: 'Generic', ratios: genericResult.ratios };
  }
  
  return null;
}

/**
 * Valida simetria temporal do padrão
 * CD ≤ 3×AB, BC ≥ 0.3×AB (relaxado)
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
  
  // Relaxado: CD ≤ 3×AB e BC ≥ 0.3×AB
  const valid = CD_AB_ratio <= 3 && BC_AB_ratio >= 0.3;
  
  return { valid, CD_AB_ratio, BC_AB_ratio };
}

/**
 * Mescla swings alternando high/low para formar sequências válidas
 */
function buildAlternatingSequences(swings: SwingPoint[]): SwingPoint[][] {
  const sequences: SwingPoint[][] = [];
  
  if (swings.length < 5) return sequences;
  
  // Tenta construir sequências alternando
  for (let start = 0; start < swings.length - 4; start++) {
    const sequence: SwingPoint[] = [swings[start]];
    let lastType = swings[start].type;
    
    for (let i = start + 1; i < swings.length && sequence.length < 5; i++) {
      // Aceita o próximo swing se for de tipo diferente
      if (swings[i].type !== lastType) {
        sequence.push(swings[i]);
        lastType = swings[i].type;
      }
    }
    
    if (sequence.length === 5) {
      sequences.push(sequence);
    }
  }
  
  return sequences;
}

export interface DetectionStats {
  totalSwings: number;
  sequencesTested: number;
  patternsBeforeFilter: number;
  patternsAfterFilter: number;
  rejectionReasons: Record<string, number>;
}

/**
 * Identifica padrões harmônicos em uma sequência de swings
 * Retorna padrões e estatísticas de detecção
 */
export function identifyHarmonicPatterns(
  swings: SwingPoint[],
  candles: Candle[],
  collectStats: boolean = false
): HarmonicPattern[] {
  const patterns: HarmonicPattern[] = [];
  
  // Constrói sequências alternando high/low
  const sequences = buildAlternatingSequences(swings);
  
  if (collectStats) {
    console.log(`[HARMONIC] Total swings: ${swings.length}, Sequências testadas: ${sequences.length}`);
  }
  
  let geometryFails = 0;
  let temporalFails = 0;
  
  for (const seq of sequences) {
    const [X, A, B, C, D] = seq;
    
    // Verifica se os tipos alternam corretamente
    const isBullish = X.type === 'low' && A.type === 'high' && 
                      B.type === 'low' && C.type === 'high' && D.type === 'low';
    
    const isBearish = X.type === 'high' && A.type === 'low' && 
                      B.type === 'high' && C.type === 'low' && D.type === 'high';
    
    if (!isBullish && !isBearish) continue;
    
    // Tenta encontrar um padrão válido
    const matchResult = findMatchingPattern(X, A, B, C, D);
    if (!matchResult) {
      geometryFails++;
      continue;
    }
    
    // Valida simetria temporal
    const temporal = validateTemporalSymmetry(A, B, C, D);
    if (!temporal.valid) {
      temporalFails++;
      continue;
    }
    
    // Encontra o candle de confirmação
    const confirmationCandle = candles[D.index + 1];
    
    patterns.push({
      id: `${D.timestamp}_${isBullish ? 'bull' : 'bear'}_${matchResult.patternName}`,
      type: isBullish ? 'bullish' : 'bearish',
      patternName: matchResult.patternName,
      points: { X, A, B, C, D },
      ratios: matchResult.ratios,
      temporalSymmetry: {
        CD_AB_ratio: temporal.CD_AB_ratio,
        BC_AB_ratio: temporal.BC_AB_ratio,
        valid: temporal.valid
      },
      valid: true,
      confirmationCandle
    });
  }
  
  if (collectStats) {
    console.log(`[HARMONIC] Geometry fails: ${geometryFails}, Temporal fails: ${temporalFails}, Patterns found: ${patterns.length}`);
  }
  
  return patterns;
}

/**
 * Classifica o padrão harmônico com base nos ratios (backward compatibility)
 */
export function classifyPattern(ratios: HarmonicPattern['ratios']): HarmonicPattern['patternName'] {
  // Gartley: AB = 61.8% XA, D = 78.6% XA
  if (ratios.AB_XA >= 0.55 && ratios.AB_XA <= 0.68 && ratios.D_XA >= 0.73 && ratios.D_XA <= 0.83) {
    return 'Gartley';
  }
  
  // Bat: AB = 38.2-50% XA, D = 88.6% XA
  if (ratios.AB_XA >= 0.32 && ratios.AB_XA <= 0.55 && ratios.D_XA >= 0.82 && ratios.D_XA <= 0.92) {
    return 'Bat';
  }
  
  // Butterfly: AB = 78.6% XA, D = 127% XA
  if (ratios.AB_XA >= 0.73 && ratios.AB_XA <= 0.82 && ratios.D_XA >= 1.22 && ratios.D_XA <= 1.42) {
    return 'Butterfly';
  }
  
  // Crab: AB = 38.2-61.8% XA, D = 161.8% XA
  if (ratios.AB_XA >= 0.32 && ratios.AB_XA <= 0.68 && ratios.D_XA >= 1.56 && ratios.D_XA <= 1.68) {
    return 'Crab';
  }
  
  return 'Generic';
}
