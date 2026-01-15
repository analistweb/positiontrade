/**
 * Tipos para estratégia de padrões harmônicos XABCD
 */

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingPoint {
  index: number;
  timestamp: number;
  price: number;
  type: 'high' | 'low';
  confirmed: boolean;
}

export interface HarmonicPattern {
  id: string;
  type: 'bullish' | 'bearish';
  patternName: 'Gartley' | 'Bat' | 'Butterfly' | 'Crab' | 'Generic';
  points: {
    X: SwingPoint;
    A: SwingPoint;
    B: SwingPoint;
    C: SwingPoint;
    D: SwingPoint;
  };
  ratios: {
    AB_XA: number;
    BC_AB: number;
    CD_BC: number;
    D_XA: number;
  };
  temporalSymmetry: {
    CD_AB_ratio: number;
    BC_AB_ratio: number;
    valid: boolean;
  };
  valid: boolean;
  confirmationCandle?: Candle;
}

export interface TradeSignal {
  type: 'buy' | 'sell' | 'waiting' | 'managing';
  pattern?: HarmonicPattern;
  entry?: number;
  stopLoss?: number;
  takeProfit1?: number; // 38.2% AD
  takeProfit2?: number; // 61.8% AD
  trailingStop?: number;
  riskPercent: number;
  timestamp: number;
  message: string;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  entryTime: number;
  exitPrice: number;
  exitTime: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  exitReason: 'tp1' | 'tp2' | 'trailing' | 'sl';
  profitR: number; // Lucro em R (múltiplos de risco)
  profitPercent: number;
  slippage: number;
  fees: number;
}

export interface BacktestConfig {
  initialCapital: number;
  riskPerTrade: number; // 1% = 0.01
  slippage: number; // 0.05% = 0.0005
  exchangeFee: number; // 0.04% = 0.0004
  swingConfirmation: number; // N candles para confirmar swing
}

export interface BacktestResult {
  trades: Trade[];
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number; // Em R
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpe: number;
  finalCapital: number;
  capitalCurve: number[];
}

export interface MonteCarloResult {
  simulations: number[];
  median: number;
  worst5Percent: number;
  best5Percent: number;
  riskOfRuin: number;
  confidenceInterval95: [number, number];
}

export interface ValidationResult {
  approved: boolean;
  status: 'APROVADA' | 'REPROVADA' | 'QUASE';
  criteria: {
    expectancy: { value: number; threshold: number; passed: boolean };
    profitFactor: { value: number; threshold: number; passed: boolean };
    maxDrawdown: { value: number; threshold: number; passed: boolean };
    winRate: { value: number; threshold: number; passed: boolean };
    monteCarloMedian: { value: number; threshold: number; passed: boolean };
    monteCarloWorst5: { value: number; threshold: number; passed: boolean };
    riskOfRuin: { value: number; threshold: number; passed: boolean };
  };
  passedCount: number;
  totalCriteria: number;
}
