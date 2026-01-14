/**
 * ASYMMETRIC_EDGE_V2 Engine
 * 
 * Estratégia focada em:
 * - Expectativa matemática positiva
 * - Trailing estrutural (sem TP fixo)
 * - Controle de risco estatístico
 * - Kelly Fraction conservador
 */

// Types
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  direction: 'LONG' | 'SHORT';
  stopLoss: number;
  pnlPercent: number;
  pnlR: number;
  exitReason: 'TRAILING_STOP' | 'INITIAL_STOP' | 'END_OF_DATA';
}

export interface BacktestResult {
  trades: Trade[];
  metrics: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    expectancy: number;
    avgWin: number;
    avgLoss: number;
    avgWinLossRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    sortinoRatio: number;
    totalReturn: number;
    kellyFraction: number;
    conservativeKelly: number;
    maxRiskPerTrade: number;
  };
  validation: {
    pfValid: boolean;
    expectancyValid: boolean;
    avgWinLossValid: boolean;
    maxDDValid: boolean;
    monteCarloMedianValid: boolean;
    overallStatus: 'APROVADO' | 'REPROVADO' | 'QUASE';
    details: string[];
  };
  equity: number[];
  drawdowns: number[];
}

export interface MonteCarloResult {
  simulations: number;
  median: number;
  mean: number;
  worst5Percent: number;
  best5Percent: number;
  ruinProbability: number;
  confidenceInterval95: [number, number];
  distribution: number[];
}

export interface AsymmetricConfig {
  trailingATRMultiplier: number;
  swingSensitivity: number;
  adxThreshold: number;
  atrPeriod: number;
  emaPeriod: number;
  initialStopATRMultiplier: number;
  pullbackMinPercent: number;
  pullbackMaxPercent: number;
}

// Default configuration
export const DEFAULT_CONFIG: AsymmetricConfig = {
  trailingATRMultiplier: 1.2,
  swingSensitivity: 5,
  adxThreshold: 20,
  atrPeriod: 14,
  emaPeriod: 50,
  initialStopATRMultiplier: 0.8,
  pullbackMinPercent: 0.382,
  pullbackMaxPercent: 0.5,
};

// ==================== INDICADORES ====================

/**
 * Calcula EMA (Exponential Moving Average)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate remaining EMAs
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
}

/**
 * Calcula ATR (Average True Range)
 */
export function calculateATR(candles: Candle[], period: number): number[] {
  const atr: number[] = [];
  const tr: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr[i] = candles[i].high - candles[i].low;
    } else {
      const hl = candles[i].high - candles[i].low;
      const hpc = Math.abs(candles[i].high - candles[i - 1].close);
      const lpc = Math.abs(candles[i].low - candles[i - 1].close);
      tr[i] = Math.max(hl, hpc, lpc);
    }
  }
  
  // First ATR is SMA of TR
  let sum = 0;
  for (let i = 0; i < period && i < tr.length; i++) {
    sum += tr[i];
  }
  atr[period - 1] = sum / period;
  
  // Smoothed ATR
  for (let i = period; i < tr.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }
  
  return atr;
}

/**
 * Calcula ADX (Average Directional Index)
 */
export function calculateADX(candles: Candle[], period: number): number[] {
  const adx: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  
  // Calculate True Range and Directional Movement
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr[i] = candles[i].high - candles[i].low;
      plusDM[i] = 0;
      minusDM[i] = 0;
    } else {
      const hl = candles[i].high - candles[i].low;
      const hpc = Math.abs(candles[i].high - candles[i - 1].close);
      const lpc = Math.abs(candles[i].low - candles[i - 1].close);
      tr[i] = Math.max(hl, hpc, lpc);
      
      const upMove = candles[i].high - candles[i - 1].high;
      const downMove = candles[i - 1].low - candles[i].low;
      
      plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
      minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
    }
  }
  
  // Smooth the values
  const smoothedTR: number[] = [];
  const smoothedPlusDM: number[] = [];
  const smoothedMinusDM: number[] = [];
  
  // First smoothed value is sum
  let sumTR = 0, sumPlusDM = 0, sumMinusDM = 0;
  for (let i = 0; i < period && i < tr.length; i++) {
    sumTR += tr[i];
    sumPlusDM += plusDM[i];
    sumMinusDM += minusDM[i];
  }
  smoothedTR[period - 1] = sumTR;
  smoothedPlusDM[period - 1] = sumPlusDM;
  smoothedMinusDM[period - 1] = sumMinusDM;
  
  for (let i = period; i < tr.length; i++) {
    smoothedTR[i] = smoothedTR[i - 1] - (smoothedTR[i - 1] / period) + tr[i];
    smoothedPlusDM[i] = smoothedPlusDM[i - 1] - (smoothedPlusDM[i - 1] / period) + plusDM[i];
    smoothedMinusDM[i] = smoothedMinusDM[i - 1] - (smoothedMinusDM[i - 1] / period) + minusDM[i];
  }
  
  // Calculate DI+ and DI-
  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];
  
  for (let i = period - 1; i < candles.length; i++) {
    if (smoothedTR[i] > 0) {
      plusDI[i] = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
      minusDI[i] = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
      
      const diSum = plusDI[i] + minusDI[i];
      dx[i] = diSum > 0 ? (Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100 : 0;
    } else {
      plusDI[i] = 0;
      minusDI[i] = 0;
      dx[i] = 0;
    }
  }
  
  // Calculate ADX (smoothed DX)
  let dxSum = 0;
  const startIdx = period - 1 + period - 1;
  for (let i = period - 1; i < startIdx && i < dx.length; i++) {
    if (dx[i] !== undefined) dxSum += dx[i];
  }
  
  if (startIdx < candles.length) {
    adx[startIdx] = dxSum / period;
    
    for (let i = startIdx + 1; i < candles.length; i++) {
      if (dx[i] !== undefined && adx[i - 1] !== undefined) {
        adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
      }
    }
  }
  
  return adx;
}

// ==================== REGIME DETECTION ====================

export type MarketRegime = 'BULL' | 'BEAR' | 'NEUTRAL';

interface SwingPoint {
  index: number;
  price: number;
  type: 'HIGH' | 'LOW';
}

/**
 * Detecta swing highs e lows
 */
function detectSwingPoints(candles: Candle[], sensitivity: number): SwingPoint[] {
  const swings: SwingPoint[] = [];
  
  for (let i = sensitivity; i < candles.length - sensitivity; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;
    
    for (let j = 1; j <= sensitivity; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isSwingHigh = false;
      }
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isSwingLow = false;
      }
    }
    
    if (isSwingHigh) {
      swings.push({ index: i, price: candles[i].high, type: 'HIGH' });
    }
    if (isSwingLow) {
      swings.push({ index: i, price: candles[i].low, type: 'LOW' });
    }
  }
  
  return swings.sort((a, b) => a.index - b.index);
}

/**
 * Detecta regime de mercado (BULL/BEAR/NEUTRAL)
 * BULL: HH/HL + preço acima EMA50
 * BEAR: LH/LL + preço abaixo EMA50
 */
function detectRegime(
  candles: Candle[],
  index: number,
  ema50: number[],
  swings: SwingPoint[]
): MarketRegime {
  const currentPrice = candles[index].close;
  const currentEMA = ema50[index];
  
  if (currentEMA === undefined) return 'NEUTRAL';
  
  // Get recent swings (last 4)
  const recentSwings = swings.filter(s => s.index < index).slice(-4);
  
  if (recentSwings.length < 4) return 'NEUTRAL';
  
  const highs = recentSwings.filter(s => s.type === 'HIGH').slice(-2);
  const lows = recentSwings.filter(s => s.type === 'LOW').slice(-2);
  
  if (highs.length < 2 || lows.length < 2) return 'NEUTRAL';
  
  const isHH = highs[1].price > highs[0].price;
  const isHL = lows[1].price > lows[0].price;
  const isLH = highs[1].price < highs[0].price;
  const isLL = lows[1].price < lows[0].price;
  
  const aboveEMA = currentPrice > currentEMA;
  const belowEMA = currentPrice < currentEMA;
  
  // BULL: Higher Highs + Higher Lows + Price above EMA50
  if (isHH && isHL && aboveEMA) return 'BULL';
  
  // BEAR: Lower Highs + Lower Lows + Price below EMA50
  if (isLH && isLL && belowEMA) return 'BEAR';
  
  return 'NEUTRAL';
}

// ==================== ENTRY SIGNALS ====================

interface EntrySignal {
  valid: boolean;
  direction: 'LONG' | 'SHORT';
  reason: string;
}

/**
 * Detecta pullback para nível de Fibonacci
 */
function detectPullback(
  candles: Candle[],
  index: number,
  swings: SwingPoint[],
  config: AsymmetricConfig
): { isPullback: boolean; direction: 'LONG' | 'SHORT' | null } {
  const recentHighs = swings.filter(s => s.type === 'HIGH' && s.index < index).slice(-1);
  const recentLows = swings.filter(s => s.type === 'LOW' && s.index < index).slice(-1);
  
  if (recentHighs.length === 0 || recentLows.length === 0) {
    return { isPullback: false, direction: null };
  }
  
  const lastHigh = recentHighs[0];
  const lastLow = recentLows[0];
  const legSize = lastHigh.price - lastLow.price;
  const currentPrice = candles[index].close;
  
  if (legSize <= 0) return { isPullback: false, direction: null };
  
  // LONG pullback: price retraced 38-50% from last leg up
  if (lastHigh.index > lastLow.index) {
    const retracement = (lastHigh.price - currentPrice) / legSize;
    if (retracement >= config.pullbackMinPercent && retracement <= config.pullbackMaxPercent) {
      return { isPullback: true, direction: 'LONG' };
    }
  }
  
  // SHORT pullback: price bounced 38-50% from last leg down
  if (lastLow.index > lastHigh.index) {
    const retracement = (currentPrice - lastLow.price) / legSize;
    if (retracement >= config.pullbackMinPercent && retracement <= config.pullbackMaxPercent) {
      return { isPullback: true, direction: 'SHORT' };
    }
  }
  
  return { isPullback: false, direction: null };
}

/**
 * Detecta consolidação curta (range apertado)
 */
function detectConsolidation(candles: Candle[], index: number, atr: number[]): boolean {
  if (index < 5 || atr[index] === undefined) return false;
  
  let range = 0;
  for (let i = index - 4; i <= index; i++) {
    range += candles[i].high - candles[i].low;
  }
  const avgRange = range / 5;
  
  // Consolidation: average range less than 50% of ATR
  return avgRange < atr[index] * 0.5;
}

/**
 * Detecta microestrutura favorável (candle de reversão)
 */
function detectMicrostructure(candles: Candle[], index: number): { valid: boolean; direction: 'LONG' | 'SHORT' | null } {
  if (index < 2) return { valid: false, direction: null };
  
  const current = candles[index];
  const prev = candles[index - 1];
  
  const body = Math.abs(current.close - current.open);
  const upperWick = current.high - Math.max(current.open, current.close);
  const lowerWick = Math.min(current.open, current.close) - current.low;
  const totalRange = current.high - current.low;
  
  if (totalRange === 0) return { valid: false, direction: null };
  
  // Bullish engulfing or hammer
  const isBullishEngulfing = current.close > current.open && 
    current.close > prev.high && 
    current.open < prev.low;
  
  const isHammer = lowerWick >= body * 2 && upperWick < body * 0.5;
  
  // Bearish engulfing or shooting star
  const isBearishEngulfing = current.close < current.open && 
    current.close < prev.low && 
    current.open > prev.high;
  
  const isShootingStar = upperWick >= body * 2 && lowerWick < body * 0.5;
  
  if (isBullishEngulfing || isHammer) {
    return { valid: true, direction: 'LONG' };
  }
  
  if (isBearishEngulfing || isShootingStar) {
    return { valid: true, direction: 'SHORT' };
  }
  
  return { valid: false, direction: null };
}

/**
 * Verifica sinal de entrada
 */
function checkEntrySignal(
  candles: Candle[],
  index: number,
  regime: MarketRegime,
  adx: number[],
  swings: SwingPoint[],
  atr: number[],
  config: AsymmetricConfig
): EntrySignal {
  // NEUTRAL regime = NO TRADE
  if (regime === 'NEUTRAL') {
    return { valid: false, direction: 'LONG', reason: 'Regime neutro - proibido operar' };
  }
  
  // ADX filter (anti-chop)
  if (adx[index] === undefined || adx[index] < config.adxThreshold) {
    return { valid: false, direction: 'LONG', reason: `ADX (${(adx[index] || 0).toFixed(1)}) < ${config.adxThreshold}` };
  }
  
  const expectedDirection = regime === 'BULL' ? 'LONG' : 'SHORT';
  
  // Check pullback
  const pullback = detectPullback(candles, index, swings, config);
  if (pullback.isPullback && pullback.direction === expectedDirection) {
    return { valid: true, direction: expectedDirection, reason: 'Pullback 38-50%' };
  }
  
  // Check consolidation breakout
  const isConsolidation = detectConsolidation(candles, index, atr);
  if (isConsolidation) {
    const prevClose = candles[index - 1].close;
    const currentClose = candles[index].close;
    
    if (regime === 'BULL' && currentClose > prevClose) {
      return { valid: true, direction: 'LONG', reason: 'Breakout de consolidação LONG' };
    }
    if (regime === 'BEAR' && currentClose < prevClose) {
      return { valid: true, direction: 'SHORT', reason: 'Breakout de consolidação SHORT' };
    }
  }
  
  // Check microstructure
  const micro = detectMicrostructure(candles, index);
  if (micro.valid && micro.direction === expectedDirection) {
    return { valid: true, direction: expectedDirection, reason: 'Microestrutura favorável' };
  }
  
  return { valid: false, direction: expectedDirection, reason: 'Sem gatilho de entrada' };
}

// ==================== TRAILING STOP ====================

/**
 * Calcula trailing stop estrutural
 */
function calculateTrailingStop(
  trade: { entryPrice: number; direction: 'LONG' | 'SHORT'; initialStop: number },
  candles: Candle[],
  currentIndex: number,
  swings: SwingPoint[],
  atr: number[],
  config: AsymmetricConfig
): number {
  const currentATR = atr[currentIndex] || 0;
  const currentPrice = candles[currentIndex].close;
  
  // Calculate current R
  const initialRisk = Math.abs(trade.entryPrice - trade.initialStop);
  const currentPnL = trade.direction === 'LONG' 
    ? currentPrice - trade.entryPrice 
    : trade.entryPrice - currentPrice;
  const currentR = initialRisk > 0 ? currentPnL / initialRisk : 0;
  
  // If we haven't reached 1R, keep initial stop
  if (currentR < 1) {
    return trade.initialStop;
  }
  
  // After 1R: trailing stop = last swing + ATR * multiplier
  const recentSwings = swings.filter(s => s.index < currentIndex);
  
  if (trade.direction === 'LONG') {
    const recentLows = recentSwings.filter(s => s.type === 'LOW').slice(-3);
    if (recentLows.length > 0) {
      const lastSwingLow = Math.max(...recentLows.map(s => s.price));
      const trailingStop = lastSwingLow - (currentATR * config.trailingATRMultiplier);
      return Math.max(trailingStop, trade.initialStop);
    }
  } else {
    const recentHighs = recentSwings.filter(s => s.type === 'HIGH').slice(-3);
    if (recentHighs.length > 0) {
      const lastSwingHigh = Math.min(...recentHighs.map(s => s.price));
      const trailingStop = lastSwingHigh + (currentATR * config.trailingATRMultiplier);
      return Math.min(trailingStop, trade.initialStop);
    }
  }
  
  return trade.initialStop;
}

// ==================== BACKTEST ENGINE ====================

/**
 * Executa backtest completo
 */
export function runAsymmetricBacktest(
  candles: Candle[],
  config: AsymmetricConfig = DEFAULT_CONFIG
): BacktestResult {
  const trades: Trade[] = [];
  const equity: number[] = [10000]; // Starting capital
  const drawdowns: number[] = [];
  
  // Calculate indicators
  const closes = candles.map(c => c.close);
  const ema50 = calculateEMA(closes, config.emaPeriod);
  const atr = calculateATR(candles, config.atrPeriod);
  const adx = calculateADX(candles, config.atrPeriod);
  const swings = detectSwingPoints(candles, config.swingSensitivity);
  
  // Minimum index to start (need enough data for indicators)
  const startIndex = Math.max(config.emaPeriod * 2, config.atrPeriod * 3);
  
  let activeTrade: {
    entryPrice: number;
    entryIndex: number;
    direction: 'LONG' | 'SHORT';
    initialStop: number;
    currentStop: number;
  } | null = null;
  
  let peakEquity = equity[0];
  
  for (let i = startIndex; i < candles.length; i++) {
    const currentCandle = candles[i];
    
    // Check for stop hit on active trade
    if (activeTrade) {
      let stopped = false;
      let exitPrice = 0;
      
      if (activeTrade.direction === 'LONG') {
        if (currentCandle.low <= activeTrade.currentStop) {
          stopped = true;
          exitPrice = activeTrade.currentStop;
        }
      } else {
        if (currentCandle.high >= activeTrade.currentStop) {
          stopped = true;
          exitPrice = activeTrade.currentStop;
        }
      }
      
      if (stopped) {
        const initialRisk = Math.abs(activeTrade.entryPrice - activeTrade.initialStop);
        const pnl = activeTrade.direction === 'LONG'
          ? exitPrice - activeTrade.entryPrice
          : activeTrade.entryPrice - exitPrice;
        const pnlPercent = (pnl / activeTrade.entryPrice) * 100;
        const pnlR = initialRisk > 0 ? pnl / initialRisk : 0;
        
        trades.push({
          entryTime: candles[activeTrade.entryIndex].timestamp,
          exitTime: currentCandle.timestamp,
          entryPrice: activeTrade.entryPrice,
          exitPrice,
          direction: activeTrade.direction,
          stopLoss: activeTrade.initialStop,
          pnlPercent,
          pnlR,
          exitReason: activeTrade.currentStop !== activeTrade.initialStop ? 'TRAILING_STOP' : 'INITIAL_STOP'
        });
        
        const currentEquity = equity[equity.length - 1];
        equity.push(currentEquity * (1 + pnlPercent / 100));
        
        activeTrade = null;
      } else {
        // Update trailing stop
        activeTrade.currentStop = calculateTrailingStop(
          { entryPrice: activeTrade.entryPrice, direction: activeTrade.direction, initialStop: activeTrade.initialStop },
          candles,
          i,
          swings,
          atr,
          config
        );
      }
    }
    
    // Check for new entry (can have multiple trades)
    if (!activeTrade) {
      const regime = detectRegime(candles, i, ema50, swings);
      const signal = checkEntrySignal(candles, i, regime, adx, swings, atr, config);
      
      if (signal.valid && atr[i] !== undefined) {
        const entryPrice = currentCandle.close;
        const stopDistance = atr[i] * config.initialStopATRMultiplier;
        const initialStop = signal.direction === 'LONG'
          ? entryPrice - stopDistance
          : entryPrice + stopDistance;
        
        activeTrade = {
          entryPrice,
          entryIndex: i,
          direction: signal.direction,
          initialStop,
          currentStop: initialStop
        };
      }
    }
    
    // Track equity and drawdown
    const currentEquity = equity[equity.length - 1];
    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const currentDD = ((peakEquity - currentEquity) / peakEquity) * 100;
    drawdowns.push(currentDD);
  }
  
  // Close any remaining trade at end of data
  if (activeTrade) {
    const lastCandle = candles[candles.length - 1];
    const initialRisk = Math.abs(activeTrade.entryPrice - activeTrade.initialStop);
    const pnl = activeTrade.direction === 'LONG'
      ? lastCandle.close - activeTrade.entryPrice
      : activeTrade.entryPrice - lastCandle.close;
    const pnlPercent = (pnl / activeTrade.entryPrice) * 100;
    const pnlR = initialRisk > 0 ? pnl / initialRisk : 0;
    
    trades.push({
      entryTime: candles[activeTrade.entryIndex].timestamp,
      exitTime: lastCandle.timestamp,
      entryPrice: activeTrade.entryPrice,
      exitPrice: lastCandle.close,
      direction: activeTrade.direction,
      stopLoss: activeTrade.initialStop,
      pnlPercent,
      pnlR,
      exitReason: 'END_OF_DATA'
    });
    
    const currentEquity = equity[equity.length - 1];
    equity.push(currentEquity * (1 + pnlPercent / 100));
  }
  
  // Calculate metrics
  const metrics = calculateMetrics(trades, equity, drawdowns);
  const validation = validateStrategy(metrics);
  
  return { trades, metrics, validation, equity, drawdowns };
}

/**
 * Calcula métricas do backtest
 */
function calculateMetrics(
  trades: Trade[],
  equity: number[],
  drawdowns: number[]
): BacktestResult['metrics'] {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      expectancy: 0,
      avgWin: 0,
      avgLoss: 0,
      avgWinLossRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      totalReturn: 0,
      kellyFraction: 0,
      conservativeKelly: 0,
      maxRiskPerTrade: 0
    };
  }
  
  const winners = trades.filter(t => t.pnlR > 0);
  const losers = trades.filter(t => t.pnlR <= 0);
  
  const winRate = winners.length / trades.length;
  const avgWin = winners.length > 0 
    ? winners.reduce((sum, t) => sum + Math.abs(t.pnlR), 0) / winners.length 
    : 0;
  const avgLoss = losers.length > 0 
    ? losers.reduce((sum, t) => sum + Math.abs(t.pnlR), 0) / losers.length 
    : 0;
  
  const grossProfit = winners.reduce((sum, t) => sum + t.pnlR, 0);
  const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.pnlR, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
  
  const maxDrawdownPercent = Math.max(...drawdowns, 0);
  const maxDrawdown = (maxDrawdownPercent / 100) * equity[0];
  
  const returns = trades.map(t => t.pnlR);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252 / (15 / 1440)) : 0; // Annualized for M15
  
  const negativeReturns = returns.filter(r => r < 0);
  const downsideDev = negativeReturns.length > 0 
    ? Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length)
    : 0;
  const sortinoRatio = downsideDev > 0 ? (avgReturn / downsideDev) * Math.sqrt(252 / (15 / 1440)) : 0;
  
  const totalReturn = ((equity[equity.length - 1] - equity[0]) / equity[0]) * 100;
  
  // Kelly Fraction
  const kellyFraction = avgLoss > 0 
    ? (winRate - ((1 - winRate) / (avgWin / avgLoss))) 
    : 0;
  const conservativeKelly = Math.max(0, Math.min(kellyFraction * 0.25, 0.01)); // 25% Kelly, max 1%
  
  return {
    totalTrades: trades.length,
    winRate,
    profitFactor,
    expectancy,
    avgWin,
    avgLoss,
    avgWinLossRatio: avgLoss > 0 ? avgWin / avgLoss : 0,
    maxDrawdown,
    maxDrawdownPercent,
    sharpeRatio,
    sortinoRatio,
    totalReturn,
    kellyFraction,
    conservativeKelly,
    maxRiskPerTrade: conservativeKelly * 100
  };
}

/**
 * Valida estratégia contra critérios
 */
function validateStrategy(metrics: BacktestResult['metrics']): BacktestResult['validation'] {
  const details: string[] = [];
  
  const pfValid = metrics.profitFactor >= 1.2;
  details.push(`PF: ${metrics.profitFactor.toFixed(2)} ${pfValid ? '✓' : '✗'} (≥1.2)`);
  
  const expectancyValid = metrics.expectancy > 0;
  details.push(`Expectativa: ${metrics.expectancy.toFixed(3)} ${expectancyValid ? '✓' : '✗'} (>0)`);
  
  const avgWinLossValid = metrics.avgWinLossRatio >= 1.5;
  details.push(`AvgWin/AvgLoss: ${metrics.avgWinLossRatio.toFixed(2)} ${avgWinLossValid ? '✓' : '✗'} (≥1.5)`);
  
  const maxDDValid = metrics.maxDrawdownPercent <= 25;
  details.push(`Max DD: ${metrics.maxDrawdownPercent.toFixed(2)}% ${maxDDValid ? '✓' : '✗'} (≤25%)`);
  
  // Monte Carlo validation will be done separately
  const monteCarloMedianValid = true; // Placeholder
  
  const passed = [pfValid, expectancyValid, avgWinLossValid, maxDDValid].filter(Boolean).length;
  let overallStatus: 'APROVADO' | 'REPROVADO' | 'QUASE';
  
  if (passed === 4) {
    overallStatus = 'APROVADO';
  } else if (passed >= 2) {
    overallStatus = 'QUASE';
  } else {
    overallStatus = 'REPROVADO';
  }
  
  return {
    pfValid,
    expectancyValid,
    avgWinLossValid,
    maxDDValid,
    monteCarloMedianValid,
    overallStatus,
    details
  };
}

// ==================== MONTE CARLO ====================

/**
 * Executa simulação Monte Carlo
 */
export function runMonteCarloSimulation(
  trades: Trade[],
  simulations: number = 1000,
  initialCapital: number = 10000
): MonteCarloResult {
  if (trades.length === 0) {
    return {
      simulations: 0,
      median: 0,
      mean: 0,
      worst5Percent: 0,
      best5Percent: 0,
      ruinProbability: 0,
      confidenceInterval95: [0, 0],
      distribution: []
    };
  }
  
  const results: number[] = [];
  const riskPerTrade = 0.01; // 1% risk per trade
  
  for (let sim = 0; sim < simulations; sim++) {
    let capital = initialCapital;
    
    // Shuffle trades
    const shuffled = [...trades].sort(() => Math.random() - 0.5);
    
    for (const trade of shuffled) {
      const riskAmount = capital * riskPerTrade;
      const pnl = riskAmount * trade.pnlR;
      capital += pnl;
      
      if (capital <= 0) {
        capital = 0;
        break;
      }
    }
    
    results.push(((capital - initialCapital) / initialCapital) * 100);
  }
  
  results.sort((a, b) => a - b);
  
  const median = results[Math.floor(results.length / 2)];
  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const worst5Percent = results[Math.floor(results.length * 0.05)];
  const best5Percent = results[Math.floor(results.length * 0.95)];
  const ruinProbability = results.filter(r => r <= -50).length / results.length;
  const ci95Low = results[Math.floor(results.length * 0.025)];
  const ci95High = results[Math.floor(results.length * 0.975)];
  
  return {
    simulations,
    median,
    mean,
    worst5Percent,
    best5Percent,
    ruinProbability,
    confidenceInterval95: [ci95Low, ci95High],
    distribution: results
  };
}

/**
 * Atualiza validação com resultados do Monte Carlo
 */
export function updateValidationWithMonteCarlo(
  validation: BacktestResult['validation'],
  monteCarlo: MonteCarloResult
): BacktestResult['validation'] {
  const monteCarloMedianValid = monteCarlo.median >= 0;
  
  const details = [...validation.details];
  details.push(`MC Mediana: ${monteCarlo.median.toFixed(2)}% ${monteCarloMedianValid ? '✓' : '✗'} (≥0%)`);
  details.push(`MC Worst 5%: ${monteCarlo.worst5Percent.toFixed(2)}%`);
  details.push(`Risco de Ruína: ${(monteCarlo.ruinProbability * 100).toFixed(2)}%`);
  
  const allValid = validation.pfValid && validation.expectancyValid && 
    validation.avgWinLossValid && validation.maxDDValid && monteCarloMedianValid;
  
  const passed = [validation.pfValid, validation.expectancyValid, 
    validation.avgWinLossValid, validation.maxDDValid, monteCarloMedianValid].filter(Boolean).length;
  
  let overallStatus: 'APROVADO' | 'REPROVADO' | 'QUASE';
  if (passed >= 4) {
    overallStatus = 'APROVADO';
  } else if (passed >= 2) {
    overallStatus = 'QUASE';
  } else {
    overallStatus = 'REPROVADO';
  }
  
  return {
    ...validation,
    monteCarloMedianValid,
    overallStatus,
    details
  };
}
