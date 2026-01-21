export interface Candle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetData {
  ticker: string;
  name: string;
  currency: string;
  candles: Candle[];
  currentPrice: number;
  previousClose: number;
  change24h: number;
  changePercent24h: number;
}

export type TrendLabel = 'Alta' | 'Baixa' | 'Lateral';

export interface TrendAnalysis {
  label: TrendLabel;
  justificativa: string;
  strength: number; // 0-100
  sma50AboveSma200: boolean;
  priceAboveSma200: boolean;
}

export type LevelStrength = 'forte' | 'média' | 'fraca';
export type LevelType = 'suporte' | 'resistência';
export type LevelOrigin = 'pivô' | 'fibonacci' | 'média móvel';

export interface SupportResistanceLevel {
  price: number;
  type: LevelType;
  strength: LevelStrength;
  origin: LevelOrigin;
}

export type EntryType = 'pullback' | 'rompimento' | 'reteste';

export interface PositionEntry {
  tipo: EntryType;
  preco: number;
  stop: number;
  alvo: number;
  racional: string;
  rr: number; // risk:reward ratio
}

export type RiskLevel = 'baixo' | 'médio' | 'alto' | 'crítico';

export interface RiskAnalysis {
  score: number; // 0-100
  sinais: string[];
  nivel: RiskLevel;
  deathCross: boolean;
  rsiBearishDivergence: boolean;
  atrIncreasing: boolean;
  supportBreak: boolean;
}

export interface TechnicalIndicators {
  sma50: number;
  sma200: number;
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  atr: number;
  atrPercent: number;
  adx: number;
}

export interface AnalysisResult {
  ticker: string;
  name: string;
  currency: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  tendencia: TrendAnalysis;
  suportesResistencias: SupportResistanceLevel[];
  positionTrade: PositionEntry[];
  indicadores: TechnicalIndicators;
  risco: RiskAnalysis;
  resumo: string;
  candles: Candle[];
  sma50Series: number[];
  sma200Series: number[];
  analyzedAt: string;
}
