/**
 * Engine de backtest determinístico para padrões harmônicos
 * Ordem cronológica, slippage 0.05%, taxa exchange 0.04%
 */

import type { 
  Candle, 
  Trade, 
  BacktestConfig, 
  BacktestResult, 
  HarmonicPattern 
} from './types';
import { detectSwings, filterSignificantSwings } from './swingDetector';
import { identifyHarmonicPatterns } from './patternDetector';
import { calculateATR, calculateStopLoss, calculateTakeProfits, calculatePositionSize } from './riskManagement';
import { calculateEMA200ForH4 } from './trendFilter';

const DEFAULT_CONFIG: BacktestConfig = {
  initialCapital: 10000,
  riskPerTrade: 0.01, // 1%
  slippage: 0.0005, // 0.05%
  exchangeFee: 0.0004, // 0.04%
  swingConfirmation: 3
};

interface ActiveTrade {
  pattern: HarmonicPattern;
  entryPrice: number;
  entryIndex: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  trailingStop: number;
  positionSize: number;
  positionRemaining: number;
  realizedPnL: number;
}

/**
 * Aplica slippage ao preço
 */
function applySlippage(price: number, isBuy: boolean, slippage: number): number {
  return isBuy ? price * (1 + slippage) : price * (1 - slippage);
}

/**
 * Calcula taxa de exchange
 */
function calculateFees(notional: number, feeRate: number): number {
  return notional * feeRate;
}

/**
 * Determina se o padrão alinha com a tendência H4
 */
function alignsWithTrend(
  pattern: HarmonicPattern,
  ema200H4: number[],
  candlesH4: Candle[],
  m15IndexToH4Index: Map<number, number>
): boolean {
  const dIndex = pattern.points.D.index;
  const h4Index = m15IndexToH4Index.get(dIndex);
  
  if (h4Index === undefined || h4Index >= ema200H4.length) {
    return false;
  }
  
  const ema = ema200H4[h4Index];
  const price = candlesH4[h4Index]?.close || 0;
  
  if (!ema || !price) return false;
  
  // Bullish: preço > EMA200
  if (pattern.type === 'bullish' && price > ema) return true;
  
  // Bearish: preço < EMA200
  if (pattern.type === 'bearish' && price < ema) return true;
  
  return false;
}

/**
 * Executa backtest completo
 */
export function backtestEngine(
  candlesM15: Candle[],
  candlesH4: Candle[],
  config: BacktestConfig = DEFAULT_CONFIG
): BacktestResult {
  const trades: Trade[] = [];
  let capital = config.initialCapital;
  const capitalCurve: number[] = [capital];
  let maxCapital = capital;
  let maxDrawdown = 0;
  
  // Mapeia índices M15 para H4
  const m15IndexToH4Index = new Map<number, number>();
  let h4Index = 0;
  for (let i = 0; i < candlesM15.length; i++) {
    while (h4Index < candlesH4.length - 1 && 
           candlesH4[h4Index + 1].timestamp <= candlesM15[i].timestamp) {
      h4Index++;
    }
    m15IndexToH4Index.set(i, h4Index);
  }
  
  // Calcula EMA200 do H4
  const ema200H4 = calculateEMA200ForH4(candlesH4);
  
  // Detecta swings
  const allSwings = detectSwings(candlesM15, config.swingConfirmation);
  const swings = filterSignificantSwings(allSwings, 5);
  
  console.log(`[BACKTEST] Swings detectados: ${swings.length}`);
  
  // Identifica padrões
  const patterns = identifyHarmonicPatterns(swings, candlesM15);
  console.log(`[BACKTEST] Padrões harmônicos encontrados: ${patterns.length}`);
  
  // Simula trades em ordem cronológica
  let activeTrade: ActiveTrade | null = null;
  let patternIndex = 0;
  
  for (let i = 0; i < candlesM15.length; i++) {
    const candle = candlesM15[i];
    
    // Verifica saídas para trade ativo
    if (activeTrade) {
      const isBullish = activeTrade.pattern.type === 'bullish';
      
      // Stop Loss
      if ((isBullish && candle.low <= activeTrade.stopLoss) ||
          (!isBullish && candle.high >= activeTrade.stopLoss)) {
        const exitPrice = applySlippage(activeTrade.stopLoss, !isBullish, config.slippage);
        const pnl = isBullish 
          ? (exitPrice - activeTrade.entryPrice) * activeTrade.positionSize * activeTrade.positionRemaining
          : (activeTrade.entryPrice - exitPrice) * activeTrade.positionSize * activeTrade.positionRemaining;
        
        const fees = calculateFees(exitPrice * activeTrade.positionSize * activeTrade.positionRemaining, config.exchangeFee);
        const netPnL = pnl - fees + activeTrade.realizedPnL;
        
        const riskAmount = config.initialCapital * config.riskPerTrade;
        const profitR = netPnL / riskAmount;
        
        trades.push({
          id: activeTrade.pattern.id,
          type: isBullish ? 'buy' : 'sell',
          entryPrice: activeTrade.entryPrice,
          entryTime: candlesM15[activeTrade.entryIndex].timestamp,
          exitPrice,
          exitTime: candle.timestamp,
          stopLoss: activeTrade.stopLoss,
          takeProfit1: activeTrade.tp1,
          takeProfit2: activeTrade.tp2,
          exitReason: 'sl',
          profitR,
          profitPercent: (netPnL / config.initialCapital) * 100,
          slippage: config.slippage,
          fees
        });
        
        capital += netPnL;
        activeTrade = null;
      }
      // TP1
      else if (activeTrade.positionRemaining > 0.5 &&
               ((isBullish && candle.high >= activeTrade.tp1) ||
                (!isBullish && candle.low <= activeTrade.tp1))) {
        const exitPrice = applySlippage(activeTrade.tp1, !isBullish, config.slippage);
        const exitSize = activeTrade.positionSize * 0.5;
        const pnl = isBullish 
          ? (exitPrice - activeTrade.entryPrice) * exitSize
          : (activeTrade.entryPrice - exitPrice) * exitSize;
        
        const fees = calculateFees(exitPrice * exitSize, config.exchangeFee);
        activeTrade.realizedPnL += pnl - fees;
        activeTrade.positionRemaining = 0.5;
        
        // Move SL para break-even
        activeTrade.stopLoss = activeTrade.entryPrice;
      }
      // TP2
      else if (activeTrade.positionRemaining === 0.5 &&
               ((isBullish && candle.high >= activeTrade.tp2) ||
                (!isBullish && candle.low <= activeTrade.tp2))) {
        const exitPrice = applySlippage(activeTrade.tp2, !isBullish, config.slippage);
        const exitSize = activeTrade.positionSize * 0.3;
        const pnl = isBullish 
          ? (exitPrice - activeTrade.entryPrice) * exitSize
          : (activeTrade.entryPrice - exitPrice) * exitSize;
        
        const fees = calculateFees(exitPrice * exitSize, config.exchangeFee);
        activeTrade.realizedPnL += pnl - fees;
        activeTrade.positionRemaining = 0.2;
        
        // Atualiza trailing
        const atrValues = calculateATR(candlesM15.slice(0, i + 1));
        const currentATR = atrValues[atrValues.length - 1] || 0;
        activeTrade.trailingStop = isBullish 
          ? candle.low - currentATR * 0.5
          : candle.high + currentATR * 0.5;
      }
      // Trailing Stop
      else if (activeTrade.positionRemaining <= 0.2) {
        if ((isBullish && candle.low <= activeTrade.trailingStop) ||
            (!isBullish && candle.high >= activeTrade.trailingStop)) {
          const exitPrice = applySlippage(activeTrade.trailingStop, !isBullish, config.slippage);
          const pnl = isBullish 
            ? (exitPrice - activeTrade.entryPrice) * activeTrade.positionSize * activeTrade.positionRemaining
            : (activeTrade.entryPrice - exitPrice) * activeTrade.positionSize * activeTrade.positionRemaining;
          
          const fees = calculateFees(exitPrice * activeTrade.positionSize * activeTrade.positionRemaining, config.exchangeFee);
          const netPnL = pnl - fees + activeTrade.realizedPnL;
          
          const riskAmount = config.initialCapital * config.riskPerTrade;
          const profitR = netPnL / riskAmount;
          
          trades.push({
            id: activeTrade.pattern.id,
            type: isBullish ? 'buy' : 'sell',
            entryPrice: activeTrade.entryPrice,
            entryTime: candlesM15[activeTrade.entryIndex].timestamp,
            exitPrice,
            exitTime: candle.timestamp,
            stopLoss: activeTrade.stopLoss,
            takeProfit1: activeTrade.tp1,
            takeProfit2: activeTrade.tp2,
            exitReason: 'trailing',
            profitR,
            profitPercent: (netPnL / config.initialCapital) * 100,
            slippage: config.slippage,
            fees
          });
          
          capital += netPnL;
          activeTrade = null;
        } else {
          // Atualiza trailing com novos swings
          const atrValues = calculateATR(candlesM15.slice(0, i + 1));
          const currentATR = atrValues[atrValues.length - 1] || 0;
          
          if (isBullish) {
            const newTrailing = candle.low - currentATR * 0.5;
            if (newTrailing > activeTrade.trailingStop) {
              activeTrade.trailingStop = newTrailing;
            }
          } else {
            const newTrailing = candle.high + currentATR * 0.5;
            if (newTrailing < activeTrade.trailingStop) {
              activeTrade.trailingStop = newTrailing;
            }
          }
        }
      }
    }
    
    // Verifica novas entradas
    if (!activeTrade && patternIndex < patterns.length) {
      const pattern = patterns[patternIndex];
      
      // Padrão foi confirmado neste candle?
      if (pattern.points.D.index + config.swingConfirmation === i) {
        // Verifica alinhamento com tendência H4
        if (alignsWithTrend(pattern, ema200H4, candlesH4, m15IndexToH4Index)) {
          const entryPrice = applySlippage(
            candle.close, 
            pattern.type === 'bullish', 
            config.slippage
          );
          
          // Encontra último swing para SL
          const lastSwing = swings.filter(s => s.index < pattern.points.D.index).pop();
          const lastSwingPrice = lastSwing?.price || pattern.points.D.price;
          
          const stopLoss = calculateStopLoss(pattern, candlesM15.slice(0, i + 1), lastSwingPrice);
          const { tp1, tp2 } = calculateTakeProfits(pattern);
          const positionSize = calculatePositionSize(capital, entryPrice, stopLoss, config.riskPerTrade);
          
          if (positionSize > 0) {
            const entryFees = calculateFees(entryPrice * positionSize, config.exchangeFee);
            capital -= entryFees;
            
            activeTrade = {
              pattern,
              entryPrice,
              entryIndex: i,
              stopLoss,
              tp1,
              tp2,
              trailingStop: stopLoss,
              positionSize,
              positionRemaining: 1.0,
              realizedPnL: -entryFees
            };
          }
        }
        patternIndex++;
      }
    }
    
    // Atualiza capital curve e drawdown
    capitalCurve.push(capital);
    maxCapital = Math.max(maxCapital, capital);
    const currentDrawdown = (maxCapital - capital) / maxCapital;
    maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
  }
  
  // Calcula métricas finais
  const winningTrades = trades.filter(t => t.profitR > 0);
  const losingTrades = trades.filter(t => t.profitR <= 0);
  
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.profitR, 0) / winningTrades.length 
    : 0;
  
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profitR, 0) / losingTrades.length)
    : 0;
  
  const totalWins = winningTrades.reduce((sum, t) => sum + t.profitR, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitR, 0));
  
  const profitFactor = totalLosses === 0 ? totalWins : totalWins / totalLosses;
  const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
  const expectancy = trades.length > 0 
    ? trades.reduce((sum, t) => sum + t.profitR, 0) / trades.length 
    : 0;
  
  // Sharpe Ratio simplificado
  const returns = trades.map(t => t.profitR);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length || 1
  );
  const sharpe = stdDev === 0 ? 0 : avgReturn / stdDev;
  
  return {
    trades,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    profitFactor,
    expectancy,
    avgWin,
    avgLoss,
    maxDrawdown,
    sharpe,
    finalCapital: capital,
    capitalCurve
  };
}
