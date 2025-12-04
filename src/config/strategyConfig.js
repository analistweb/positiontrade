/**
 * CONFIGURAÇÃO VERSIONADA DA ESTRATÉGIA
 * Todos os parâmetros calibráveis em um único local
 * Versão: 2.0.0
 */

export const STRATEGY_VERSION = '2.0.0';

export const defaultStrategyConfig = {
  version: STRATEGY_VERSION,
  
  // ========== HIERARQUIA DE INDICADORES ==========
  indicators: {
    // Nível 1 - Obrigatórios (nunca bloqueiam, mas são essenciais)
    level1: {
      breakout: { weight: 20, required: true },
      trendDirection: { weight: 15, required: true },
      candleStrength: { weight: 10, required: true }
    },
    // Nível 2 - Confirmações fortes
    level2: {
      volume: { weight: 15, required: false },
      obv: { weight: 10, required: false },
      macd: { weight: 15, required: false },
      didi: { weight: 5, required: false }
    },
    // Nível 3 - Situacionais (ajustam probabilidade)
    level3: {
      rsi: { weight: 5, required: false },
      adx: { weight: 5, required: false },
      vroc: { weight: 0, required: false }
    }
  },
  
  // ========== SCORING PROBABILÍSTICO ==========
  scoring: {
    thresholds: {
      strong: 70,    // >= 70% = Sinal Forte
      medium: 50,    // 50-69% = Sinal Médio
      weak: 30,      // 30-49% = Sinal Fraco (só em modo alta forte)
      rejected: 0    // < 30% = Rejeitado
    },
    // Score mínimo por regime de mercado
    minScoreByRegime: {
      trend: 50,        // Em tendência, aceita médio
      consolidation: 70, // Em consolidação, exige forte
      strongRally: 45   // Em alta forte, mais permissivo
    }
  },
  
  // ========== BREAKOUT COM ATR ==========
  breakout: {
    // Substituir 0.05% fixo por múltiplo de ATR
    atrMultiplier: {
      strong: 0.5,    // Breakout forte: >= 0.5 ATR
      moderate: 0.3,  // Breakout moderado: >= 0.3 ATR
      weak: 0.15      // Breakout fraco: >= 0.15 ATR
    },
    // Categorias de breakout
    categories: {
      strong: { minScore: 80, allowEntry: true },
      moderate: { minScore: 60, allowEntry: true, requireVolumeConfirm: true },
      partial: { minScore: 45, allowEntry: false, allowInStrongRally: true }
    },
    // Filtros de exaustão
    exhaustion: {
      maxWickRatio: 0.5,     // Wick contra <= 50% do corpo
      minBodyRatio: 0.6,     // Corpo >= 60% do range
      maxDistanceFromVWAP: 1.5 // Max 1.5 ATR de distância da EMA/VWAP
    }
  },
  
  // ========== RSI FLEXÍVEL ==========
  rsi: {
    period: 14,
    ranges: {
      buy: { min: 30, max: 80 },
      sell: { min: 20, max: 70 }
    },
    // Penalização por zona extrema (não bloqueia)
    penaltyZones: {
      overbought: { threshold: 75, penalty: 5 },
      oversold: { threshold: 25, penalty: 5 }
    },
    // Midline para regime de tendência
    midline: 50,
    midlineBuffer: 10 // 40-60 zona neutra
  },
  
  // ========== ADX ADAPTATIVO ==========
  adx: {
    period: 14,
    regimes: {
      strongTrend: { min: 35, scoreBonus: 10 },
      normalTrend: { min: 25, scoreBonus: 5 },
      weakTrend: { min: 20, scoreBonus: 0, reduceConfirmWeight: true },
      chop: { max: 20, blockContinuation: true, allowMeanReversion: true }
    },
    // Gating: ADX < 20 bloqueia trades de continuação
    gating: {
      minForContinuation: 20,
      minForFullWeight: 25
    }
  },
  
  // ========== TENDÊNCIA EMA + HTF ==========
  trend: {
    ema: {
      fast: 9,
      medium: 21,
      slow: 50
    },
    // Exigir acordo de pelo menos 2 de 3
    minAgreement: 2,
    // Slope da EMA para confirmar direção
    slopeMinPeriods: 3,
    slopeMinChange: 0.001 // 0.1% mudança mínima
  },
  
  // ========== CANDLE DE FORÇA ==========
  candleStrength: {
    minBodyToATR: 0.7,        // Body >= 70% do ATR
    minTrueRangeToATR: 1.0,   // True Range >= 100% do ATR
    closingPosition: 0.33,    // Fechamento no terço superior/inferior
    maxWickAgainstRatio: 0.35 // Wick contra <= 35% do body
  },
  
  // ========== FIBONACCI ADAPTATIVO ==========
  fibonacci: {
    // Lookback fixo para evitar repaint
    pivotLookback: { major: 20, minor: 5 },
    // Níveis por força do ADX
    levelsByADX: {
      strong: { tp: 0.618, sl: 0.382 },    // ADX > 40
      moderate: { tp: 0.5, sl: 0.5 },      // ADX 30-40
      weak: { tp: 0.382, sl: 0.618 }       // ADX 25-30
    },
    // Nunca atualizar pivôs até próximo confirmado
    lockUntilNextPivot: true
  },
  
  // ========== GESTÃO DE RISCO ==========
  risk: {
    // SL/TP baseados em ATR e pernada
    slMultiplierByADX: {
      strong: { atr: 0.5, legFib: 0.5 },   // ADX > 40
      moderate: { atr: 0.7, legFib: 0.618 }, // ADX 30-40
      weak: { atr: 1.0, legFib: 0.786 }    // ADX 25-30
    },
    tpMultiplierByADX: {
      strong: { atr: 1.5, legFib: 0.618 }, // ADX > 40
      moderate: { atr: 1.2, legFib: 0.5 }, // ADX 30-40
      weak: { atr: 1.0, legFib: 0.382 }    // ADX 25-30
    },
    // Limites de R:R
    minRiskReward: 1.0,
    idealRiskReward: 1.3,
    // Range de SL em % do preço
    slRange: { min: 0.25, max: 0.45 },
    // Position sizing
    maxRiskPerTrade: 0.02, // 2% do capital
    // Break-even dinâmico
    breakEven: {
      activateAt: 0.6,     // 60% do caminho para TP
      moveToLevel: 'previousCandleLow' // Mover SL para low/high anterior
    }
  },
  
  // ========== REENTRADAS ==========
  reentry: {
    enabled: true,
    // Cooldown em candles antes de permitir reentrada
    cooldownCandles: 2,
    // Pullback máximo para considerar reentrada válida
    maxPullback: 0.382, // Fib 38.2%
    // Exigir volume sustentado
    requireSustainedVolume: true,
    // Max adds por posição
    maxAdds: 1,
    // Score deve melhorar para adicionar
    requireScoreImprovement: true
  },
  
  // ========== MODO ALTA FORTE ==========
  strongRally: {
    enabled: true,
    // Detecção automática
    detection: {
      minPriceChange: 0.03,      // 3% em 4h
      minVolumeMultiplier: 1.5,  // 1.5x volume médio
      minADX: 30
    },
    // Parâmetros relaxados
    relaxedParams: {
      rsiRange: { buy: { min: 25, max: 85 }, sell: { min: 15, max: 75 } },
      minScore: 45,
      acceptPartialBreakout: true,
      volumeMinMultiplier: 0.8
    },
    // Guardas de exaustão mantidos
    exhaustionGuards: {
      maxDistanceFromEMA: 2.0,   // 2 ATR da EMA
      maxWickRatio: 0.6,
      checkOBVDivergence: true
    }
  },
  
  // ========== VOLUME ==========
  volume: {
    avgPeriod: 20,
    // Thresholds normalizados
    thresholds: {
      strong: 1.5,     // >= 1.5x média
      normal: 1.0,     // >= 1.0x média
      weak: 0.7,       // >= 0.7x média (parcial)
      insufficient: 0  // < 0.7x média
    }
  },
  
  // ========== MACD ==========
  macd: {
    fast: 12,
    slow: 26,
    signal: 9,
    // Aceitar MACD positivo OU cruzando
    acceptCrossingOnly: true,
    // Preferir histograma crescente
    preferGrowingHistogram: true,
    // Penalizar divergência persistente
    divergencePenalty: 10
  },
  
  // ========== JANELAS DE TEMPO ==========
  timeFilters: {
    enabled: false, // Desabilitado por padrão (crypto 24/7)
    // Evitar primeiros/últimos minutos do candle
    avoidCandleEdges: {
      enabled: true,
      minutesFromStart: 2,
      minutesFromEnd: 1
    }
  },
  
  // ========== LOGGING E DIAGNÓSTICO ==========
  diagnostics: {
    enabled: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    persistToStorage: true,
    maxStoredLogs: 500,
    // Incluir hash do input para reprodutibilidade
    includeInputHash: true,
    // Incluir todas as métricas no sinal
    includeFullMetrics: true
  }
};

/**
 * Configurações específicas por ativo
 */
export const assetConfigs = {
  BTCUSDT: {
    name: 'Bitcoin',
    volatilityProfile: 'medium',
    expectedVolume: 'high',
    atrMultiplier: 1.0,
    customParams: {}
  },
  ETHUSDT: {
    name: 'Ethereum',
    volatilityProfile: 'medium-high',
    expectedVolume: 'high',
    atrMultiplier: 1.0,
    customParams: {}
  },
  SOLUSDT: {
    name: 'Solana',
    volatilityProfile: 'high',
    expectedVolume: 'medium',
    atrMultiplier: 1.2, // Mais volátil
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
  },
  XRPUSDT: {
    name: 'XRP',
    volatilityProfile: 'high',
    expectedVolume: 'medium',
    atrMultiplier: 1.3,
    customParams: {}
  },
  DOGEUSDT: {
    name: 'Dogecoin',
    volatilityProfile: 'very-high',
    expectedVolume: 'variable',
    atrMultiplier: 1.5,
    customParams: {
      scoring: { thresholds: { strong: 75 } } // Mais conservador para memes
    }
  },
  ADAUSDT: {
    name: 'Cardano',
    volatilityProfile: 'high',
    expectedVolume: 'medium',
    atrMultiplier: 1.2,
    customParams: {}
  },
  DOTUSDT: {
    name: 'Polkadot',
    volatilityProfile: 'high',
    expectedVolume: 'medium',
    atrMultiplier: 1.2,
    customParams: {}
  },
  PAXGUSDT: {
    name: 'PAX Gold',
    volatilityProfile: 'low',
    expectedVolume: 'low',
    atrMultiplier: 0.7, // Menos volátil (ouro)
    customParams: {
      breakout: { atrMultiplier: { strong: 0.3 } }
    }
  },
  USDTUSDC: {
    name: 'USDT/USDC',
    volatilityProfile: 'minimal',
    expectedVolume: 'variable',
    atrMultiplier: 0.5,
    customParams: {
      // Stablecoin - estratégia diferente
      enabled: false
    }
  }
};

/**
 * Mescla configuração base com configuração do ativo
 */
export const getConfigForAsset = (symbol, customOverrides = {}) => {
  const baseConfig = { ...defaultStrategyConfig };
  const assetConfig = assetConfigs[symbol] || {};
  
  // Deep merge das configurações
  const merged = deepMerge(baseConfig, assetConfig.customParams || {});
  const final = deepMerge(merged, customOverrides);
  
  // Adicionar metadata do ativo
  final.asset = {
    symbol,
    name: assetConfig.name || symbol,
    volatilityProfile: assetConfig.volatilityProfile || 'medium',
    atrMultiplier: assetConfig.atrMultiplier || 1.0
  };
  
  return final;
};

/**
 * Deep merge helper
 */
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
