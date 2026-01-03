/**
 * CONFIGURAÇÃO VERSIONADA DA ESTRATÉGIA ETHUSDT 15m
 * Sistema de versionamento para A/B testing e validação estatística
 * Versão: 3.0.0
 */

export const STRATEGY_VERSION = '3.0.0';

// ============================================
// BASELINE v1.0 (CONGELADO - NÃO MODIFICAR)
// Referência para métricas: PF, Expectativa, DD, Win Rate
// ============================================
export const STRATEGY_V1_0_BASELINE = Object.freeze({
  version: '1.0.0',
  frozen: true,
  description: 'Baseline original com todos os indicadores - REFERÊNCIA',
  
  indicators: {
    level1: {
      breakout: { weight: 20, required: true },
      trendDirection: { weight: 15, required: true },
      candleStrength: { weight: 10, required: true }
    },
    level2: {
      volume: { weight: 15, required: false },
      obv: { weight: 10, required: false },
      macd: { weight: 15, required: false },
      didi: { weight: 5, required: false }
    },
    level3: {
      rsi: { weight: 5, required: false },
      adx: { weight: 5, required: false },
      vroc: { weight: 0, required: false }
    }
  },
  
  scoring: {
    thresholds: { strong: 70, medium: 50, weak: 30, rejected: 0 },
    minScoreByRegime: { trend: 50, consolidation: 70, strongRally: 45 }
  },
  
  breakout: {
    atrMultiplier: { strong: 0.5, moderate: 0.3, weak: 0.15 },
    categories: {
      strong: { minScore: 80, allowEntry: true },
      moderate: { minScore: 60, allowEntry: true, requireVolumeConfirm: true },
      partial: { minScore: 45, allowEntry: false, allowInStrongRally: true }
    },
    exhaustion: {
      maxWickRatio: 0.5,
      minBodyRatio: 0.6,
      maxDistanceFromVWAP: 1.5
    }
  },
  
  rsi: {
    period: 14,
    ranges: { buy: { min: 30, max: 80 }, sell: { min: 20, max: 70 } },
    penaltyZones: {
      overbought: { threshold: 75, penalty: 5 },
      oversold: { threshold: 25, penalty: 5 }
    },
    midline: 50,
    midlineBuffer: 10
  },
  
  adx: {
    period: 14,
    regimes: {
      strongTrend: { min: 35, scoreBonus: 10 },
      normalTrend: { min: 25, scoreBonus: 5 },
      weakTrend: { min: 20, scoreBonus: 0, reduceConfirmWeight: true },
      chop: { max: 20, blockContinuation: true, allowMeanReversion: true }
    },
    gating: { minForContinuation: 20, minForFullWeight: 25 }
  },
  
  trend: {
    ema: { fast: 9, medium: 21, slow: 50 },
    minAgreement: 2,
    slopeMinPeriods: 3,
    slopeMinChange: 0.001
  },
  
  candleStrength: {
    minBodyToATR: 0.7,
    minTrueRangeToATR: 1.0,
    closingPosition: 0.33,
    maxWickAgainstRatio: 0.35
  },
  
  fibonacci: {
    pivotLookback: { major: 20, minor: 5 },
    levelsByADX: {
      strong: { tp: 0.618, sl: 0.382 },
      moderate: { tp: 0.5, sl: 0.5 },
      weak: { tp: 0.382, sl: 0.618 }
    },
    lockUntilNextPivot: true
  },
  
  risk: {
    slMultiplierByADX: {
      strong: { atr: 0.5, legFib: 0.5 },
      moderate: { atr: 0.7, legFib: 0.618 },
      weak: { atr: 1.0, legFib: 0.786 }
    },
    tpMultiplierByADX: {
      strong: { atr: 1.5, legFib: 0.618 },
      moderate: { atr: 1.2, legFib: 0.5 },
      weak: { atr: 1.0, legFib: 0.382 }
    },
    minRiskReward: 1.0,
    idealRiskReward: 1.3,
    slRange: { min: 0.25, max: 0.45 },
    maxRiskPerTrade: 0.02,
    breakEven: { activateAt: 0.6, moveToLevel: 'previousCandleLow' }
  },
  
  reentry: {
    enabled: true,
    cooldownCandles: 2,
    maxPullback: 0.382,
    requireSustainedVolume: true,
    maxAdds: 1,
    requireScoreImprovement: true
  },
  
  strongRally: {
    enabled: true,
    detection: { minPriceChange: 0.03, minVolumeMultiplier: 1.5, minADX: 30 },
    relaxedParams: {
      rsiRange: { buy: { min: 25, max: 85 }, sell: { min: 15, max: 75 } },
      minScore: 45,
      acceptPartialBreakout: true,
      volumeMinMultiplier: 0.8
    },
    exhaustionGuards: {
      maxDistanceFromEMA: 2.0,
      maxWickRatio: 0.6,
      checkOBVDivergence: true
    }
  },
  
  volume: {
    avgPeriod: 20,
    thresholds: { strong: 1.5, normal: 1.0, weak: 0.7, insufficient: 0 }
  },
  
  macd: {
    fast: 12,
    slow: 26,
    signal: 9,
    acceptCrossingOnly: true,
    preferGrowingHistogram: true,
    divergencePenalty: 10
  },
  
  timeFilters: {
    enabled: false,
    avoidCandleEdges: { enabled: true, minutesFromStart: 2, minutesFromEnd: 1 }
  },
  
  diagnostics: {
    enabled: true,
    logLevel: 'info',
    persistToStorage: true,
    maxStoredLogs: 500,
    includeInputHash: true,
    includeFullMetrics: true
  },
  
  // Métricas do baseline (a serem preenchidas após backtest)
  baselineMetrics: {
    profitFactor: null,
    expectancy: null,
    maxDrawdown: null,
    winRate: null,
    sharpeRatio: null,
    sortinoRatio: null
  }
});

// ============================================
// v1.1 - NÚCLEO SIMPLIFICADO (Pullback + ATR Fixo)
// Remove RSI, MACD, OBV, Score de mercado
// Mantém: EMA50, ADX, Volume, Pivots
// ============================================
export const STRATEGY_V1_1 = {
  version: '1.1.0',
  description: 'Núcleo simplificado: EMA50 + ADX + Volume + Pivots + ATR fixo',
  
  // ===== ENTRADA SIMPLIFICADA =====
  entry: {
    // Indicadores REMOVIDOS (Fase 1)
    useRSI: false,
    useMACD: false,
    useOBV: false,
    useMarketScore: false,
    useDidi: false,
    
    // Núcleo mantido
    emaLength: 50,
    emaSlopeThreshold: 0.0005,     // Inclinação mínima da EMA
    emaSlopeLookback: 5,           // Candles para calcular slope
    
    adxMin: 25,                    // ADX mínimo para entrada
    adxTrendStrong: 30,            // ADX para tendência forte
    
    // Validação de Pullback (30-60% da pernada)
    pullbackMin: 0.30,
    pullbackMax: 0.60,
    
    // Volume mínimo = média
    volumeMultiplier: 1.0,
    volumeAvgPeriod: 20,
    
    // Pivots estruturais
    pivotLookback: 5,
    minLegSize: 0.002,             // 0.2% mínimo de pernada
  },
  
  // ===== GESTÃO DE RISCO ATR FIXA =====
  risk: {
    // SL/TP fixos baseados em ATR
    slMultiplier: 1.35,            // SL = 1.35 * ATR (média de 1.2-1.5)
    tpMultiplier: 2.75,            // TP = 2.75 * ATR (média de 2.5-3.0)
    
    // Limites de SL em % do preço
    slMinPercent: 0.3,             // Mínimo 0.3%
    slMaxPercent: 1.5,             // Máximo 1.5%
    
    // Risco por trade
    riskPerTrade: 0.005,           // 0.5% máximo por trade
    
    // Não usar TP/SL dinâmicos
    useDynamicTPSL: false,
    
    // Saída parcial em 1R
    partialExitEnabled: true,
    partialExitAt: 1.0,            // Em 1R
    partialExitPercent: 0.35,      // 35% da posição
    
    // Break-even em 1.5R
    breakEvenEnabled: true,
    moveToBreakevenAt: 1.5,
  },
  
  // ===== FILTRO DE REGIME DE MERCADO =====
  regime: {
    enabled: true,
    adxMinRegime: 20,              // ADX mínimo para permitir trade
    emaSlopeMin: 0.0003,           // Inclinação mínima da EMA50
    maxDistanceFromEMA: 1.5,       // Máximo 1.5 * ATR de distância
  },
  
  // ===== PARÂMETROS DE INDICADORES (simplificados) =====
  trend: {
    ema: { fast: 9, medium: 21, slow: 50 },
    slopeMinPeriods: 5,
    slopeMinChange: 0.0005
  },
  
  fibonacci: {
    pivotLookback: { major: 20, minor: 5 },
    levelsByADX: {
      strong: { tp: 0.618, sl: 0.382 },
      moderate: { tp: 0.5, sl: 0.5 },
      weak: { tp: 0.382, sl: 0.618 }
    }
  },
  
  volume: {
    avgPeriod: 20,
    thresholds: { strong: 1.5, normal: 1.0, weak: 0.7, insufficient: 0 }
  },
  
  breakout: {
    atrMultiplier: { strong: 0.5, moderate: 0.3, weak: 0.15 },
    exhaustion: {
      maxWickRatio: 0.5,
      minBodyRatio: 0.5,
      maxDistanceFromVWAP: 1.5
    }
  },
  
  candleStrength: {
    minBodyToATR: 0.5,
    minTrueRangeToATR: 0.8,
    closingPosition: 0.33,
    maxWickAgainstRatio: 0.4
  },
  
  diagnostics: {
    enabled: true,
    logLevel: 'info',
    includeInputHash: true,
    includeFullMetrics: true
  }
};

// ============================================
// v1.2 - v1.1 + Filtro ADX Aprimorado
// ============================================
export const STRATEGY_V1_2 = {
  ...STRATEGY_V1_1,
  version: '1.2.0',
  description: 'v1.1 + Filtro ADX aprimorado (ADX rising)',
  
  entry: {
    ...STRATEGY_V1_1.entry,
    adxMin: 22,
    adxTrendStrong: 28,
    adxRising: true,               // ADX deve estar subindo
    adxRisingLookback: 3,          // Candles para verificar
  },
};

// ============================================
// v1.3 - v1.2 + Saída Parcial em 1R
// ============================================
export const STRATEGY_V1_3 = {
  ...STRATEGY_V1_2,
  version: '1.3.0',
  description: 'v1.2 + Saída parcial agressiva em 1R',
  
  risk: {
    ...STRATEGY_V1_2.risk,
    partialExitAt: 1.0,
    partialExitPercent: 0.40,      // 40% da posição
  },
};

// ============================================
// v1.4 - v1.3 + RSI como Filtro de Extremos
// ============================================
export const STRATEGY_V1_4 = {
  ...STRATEGY_V1_3,
  version: '1.4.0',
  description: 'v1.3 + RSI para descartar extremos',
  
  entry: {
    ...STRATEGY_V1_3.entry,
    useRSI: true,
    rsiAsFilter: true,             // Apenas como filtro, não como condição
    rsiOverbought: 75,             // Bloqueia compra se RSI > 75
    rsiOversold: 25,               // Bloqueia venda se RSI < 25
    rsiPeriod: 14,
  },
};

// ============================================
// CRITÉRIOS DE APROVAÇÃO ESTATÍSTICA
// ============================================
export const APPROVAL_CRITERIA = Object.freeze({
  // Métricas mínimas
  minProfitFactor: 1.3,
  minSharpe: 0.5,
  minSortino: 0.7,
  
  // Risco
  maxWorstCase5Percent: -0.25,     // Pior cenário 5% não pode ser < -25%
  maxDrawdown: 0.30,               // Max drawdown 30%
  
  // Probabilidades
  minProfitProbability: 0.60,      // 60% chance de lucro
  maxRuinProbability: 0.05,        // Máximo 5% chance de ruína
  
  // Dados mínimos
  minTrades: 30,
  
  // Monte Carlo
  monteCarloPermutations: 1000,
  confidenceLevel: 0.95,
  
  // Walk-forward
  walkForwardWindows: 3,           // 3 janelas de validação
  minWinRatePerWindow: 0.40,       // 40% min por janela
});

// ============================================
// VERSÃO ATIVA
// ============================================
export const ACTIVE_VERSION = 'v1.1';

export const getActiveConfig = () => {
  const versions = {
    'v1.0': STRATEGY_V1_0_BASELINE,
    'v1.1': STRATEGY_V1_1,
    'v1.2': STRATEGY_V1_2,
    'v1.3': STRATEGY_V1_3,
    'v1.4': STRATEGY_V1_4,
  };
  
  return versions[ACTIVE_VERSION] || STRATEGY_V1_1;
};

export const getAllVersions = () => [
  { id: 'v1.0', config: STRATEGY_V1_0_BASELINE, frozen: true, label: 'Baseline (Congelado)' },
  { id: 'v1.1', config: STRATEGY_V1_1, frozen: false, label: 'Núcleo Simplificado' },
  { id: 'v1.2', config: STRATEGY_V1_2, frozen: false, label: '+ ADX Rising' },
  { id: 'v1.3', config: STRATEGY_V1_3, frozen: false, label: '+ Parcial 1R' },
  { id: 'v1.4', config: STRATEGY_V1_4, frozen: false, label: '+ RSI Filtro' },
];

// ============================================
// CONFIGURAÇÃO LEGADA (compatibilidade)
// ============================================
export const defaultStrategyConfig = {
  version: STRATEGY_VERSION,
  
  indicators: {
    level1: {
      breakout: { weight: 20, required: true },
      trendDirection: { weight: 15, required: true },
      candleStrength: { weight: 10, required: true }
    },
    level2: {
      volume: { weight: 15, required: false },
      obv: { weight: 10, required: false },
      macd: { weight: 15, required: false },
      didi: { weight: 5, required: false }
    },
    level3: {
      rsi: { weight: 5, required: false },
      adx: { weight: 5, required: false },
      vroc: { weight: 0, required: false }
    }
  },
  
  scoring: {
    thresholds: { strong: 70, medium: 50, weak: 30, rejected: 0 },
    minScoreByRegime: { trend: 50, consolidation: 70, strongRally: 45 }
  },
  
  breakout: {
    atrMultiplier: { strong: 0.5, moderate: 0.3, weak: 0.15 },
    categories: {
      strong: { minScore: 80, allowEntry: true },
      moderate: { minScore: 60, allowEntry: true, requireVolumeConfirm: true },
      partial: { minScore: 45, allowEntry: false, allowInStrongRally: true }
    },
    exhaustion: {
      maxWickRatio: 0.5,
      minBodyRatio: 0.6,
      maxDistanceFromVWAP: 1.5
    }
  },
  
  rsi: {
    period: 14,
    ranges: { buy: { min: 30, max: 80 }, sell: { min: 20, max: 70 } },
    penaltyZones: {
      overbought: { threshold: 75, penalty: 5 },
      oversold: { threshold: 25, penalty: 5 }
    },
    midline: 50,
    midlineBuffer: 10
  },
  
  adx: {
    period: 14,
    regimes: {
      strongTrend: { min: 35, scoreBonus: 10 },
      normalTrend: { min: 25, scoreBonus: 5 },
      weakTrend: { min: 20, scoreBonus: 0, reduceConfirmWeight: true },
      chop: { max: 20, blockContinuation: true, allowMeanReversion: true }
    },
    gating: { minForContinuation: 20, minForFullWeight: 25 }
  },
  
  trend: {
    ema: { fast: 9, medium: 21, slow: 50 },
    minAgreement: 2,
    slopeMinPeriods: 3,
    slopeMinChange: 0.001
  },
  
  candleStrength: {
    minBodyToATR: 0.7,
    minTrueRangeToATR: 1.0,
    closingPosition: 0.33,
    maxWickAgainstRatio: 0.35
  },
  
  fibonacci: {
    pivotLookback: { major: 20, minor: 5 },
    levelsByADX: {
      strong: { tp: 0.618, sl: 0.382 },
      moderate: { tp: 0.5, sl: 0.5 },
      weak: { tp: 0.382, sl: 0.618 }
    },
    lockUntilNextPivot: true
  },
  
  risk: {
    slMultiplierByADX: {
      strong: { atr: 0.5, legFib: 0.5 },
      moderate: { atr: 0.7, legFib: 0.618 },
      weak: { atr: 1.0, legFib: 0.786 }
    },
    tpMultiplierByADX: {
      strong: { atr: 1.5, legFib: 0.618 },
      moderate: { atr: 1.2, legFib: 0.5 },
      weak: { atr: 1.0, legFib: 0.382 }
    },
    minRiskReward: 1.0,
    idealRiskReward: 1.3,
    slRange: { min: 0.15, max: 1.5 },
    maxRiskPerTrade: 0.02,
    breakEven: { activateAt: 0.6, moveToLevel: 'previousCandleLow' }
  },
  
  reentry: {
    enabled: true,
    cooldownCandles: 2,
    maxPullback: 0.382,
    requireSustainedVolume: true,
    maxAdds: 1,
    requireScoreImprovement: true
  },
  
  strongRally: {
    enabled: true,
    detection: { minPriceChange: 0.03, minVolumeMultiplier: 1.5, minADX: 30 },
    relaxedParams: {
      rsiRange: { buy: { min: 25, max: 85 }, sell: { min: 15, max: 75 } },
      minScore: 45,
      acceptPartialBreakout: true,
      volumeMinMultiplier: 0.8
    },
    exhaustionGuards: {
      maxDistanceFromEMA: 2.0,
      maxWickRatio: 0.6,
      checkOBVDivergence: true
    }
  },
  
  volume: {
    avgPeriod: 20,
    thresholds: { strong: 1.5, normal: 1.0, weak: 0.7, insufficient: 0 }
  },
  
  macd: {
    fast: 12,
    slow: 26,
    signal: 9,
    acceptCrossingOnly: true,
    preferGrowingHistogram: true,
    divergencePenalty: 10
  },
  
  timeFilters: {
    enabled: false,
    avoidCandleEdges: { enabled: true, minutesFromStart: 2, minutesFromEnd: 1 }
  },
  
  diagnostics: {
    enabled: true,
    logLevel: 'info',
    persistToStorage: true,
    maxStoredLogs: 500,
    includeInputHash: true,
    includeFullMetrics: true
  }
};

/**
 * Configurações específicas por ativo
 */
export const assetConfigs = {
  ETHUSDT: {
    name: 'Ethereum',
    volatilityProfile: 'medium-high',
    expectedVolume: 'high',
    atrMultiplier: 1.0,
    customParams: {}
  },
  BTCUSDT: {
    name: 'Bitcoin',
    volatilityProfile: 'medium',
    expectedVolume: 'high',
    atrMultiplier: 1.0,
    customParams: {}
  },
  SOLUSDT: {
    name: 'Solana',
    volatilityProfile: 'high',
    expectedVolume: 'medium',
    atrMultiplier: 1.2,
    customParams: {
      breakout: { atrMultiplier: { strong: 0.6 } }
    }
  },
  BNBUSDT: {
    name: 'BNB',
    volatilityProfile: 'medium',
    expectedVolume: 'medium',
    atrMultiplier: 1.0,
    customParams: {}
  }
};

/**
 * Mescla configuração base com configuração do ativo
 */
export const getConfigForAsset = (symbol, customOverrides = {}) => {
  const baseConfig = { ...defaultStrategyConfig };
  const assetConfig = assetConfigs[symbol] || {};
  
  const merged = deepMerge(baseConfig, assetConfig.customParams || {});
  const final = deepMerge(merged, customOverrides);
  
  final.asset = {
    symbol,
    name: assetConfig.name || symbol,
    volatilityProfile: assetConfig.volatilityProfile || 'medium',
    atrMultiplier: assetConfig.atrMultiplier || 1.0
  };
  
  return final;
};

const deepMerge = (target, source) => {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
};

export default defaultStrategyConfig;
