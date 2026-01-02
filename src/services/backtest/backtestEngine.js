/**
 * BACKTEST ENGINE
 * Simula a estratégia de trading em dados históricos
 * para avaliar sua eficácia antes de operar em tempo real
 */

import { calculateSignal, checkExitConditions } from '../strategyEngine/core/signalEngine';
import { getConfigForAsset } from '@/config/strategyConfig';

/**
 * Executa backtest completo da estratégia
 * @param {Array} historicalData - Dados históricos de candles
 * @param {string} symbol - Par de trading (ex: ETHUSDT)
 * @param {Object} options - Opções de backtest
 * @returns {Object} Resultados do backtest
 */
export const runBacktest = (historicalData, symbol, options = {}) => {
  const {
    initialCapital = 10000,
    riskPerTrade = 0.02, // 2% por trade
    commission = 0.001, // 0.1% taxa
    slippage = 0.0005, // 0.05% slippage
    minDataPoints = 100,
    startIndex = null,
    endIndex = null
  } = options;

  const config = getConfigForAsset(symbol);
  
  // Validações
  if (!historicalData || historicalData.length < minDataPoints) {
    return {
      success: false,
      error: `Dados insuficientes. Mínimo: ${minDataPoints}, recebido: ${historicalData?.length || 0}`
    };
  }

  // Determinar range de simulação
  const start = startIndex || minDataPoints;
  const end = endIndex || historicalData.length;

  // Estado do backtest
  const state = {
    capital: initialCapital,
    peakCapital: initialCapital,
    position: null,
    trades: [],
    equityCurve: [{ index: start, capital: initialCapital, time: historicalData[start]?.timestamp }],
    drawdowns: [],
    signals: {
      generated: 0,
      executed: 0,
      rejected: 0
    }
  };

  // Loop principal - simular candle por candle
  for (let i = start; i < end; i++) {
    const dataWindow = historicalData.slice(0, i + 1);
    const currentCandle = historicalData[i];
    
    // 1. Verificar posição aberta
    if (state.position) {
      const exitCheck = simulateExit(state.position, currentCandle, config);
      
      if (exitCheck.shouldExit) {
        // Fechar posição
        const trade = closeTrade(state, currentCandle, exitCheck, commission, slippage);
        state.trades.push(trade);
        state.position = null;
        
        // Atualizar equity curve
        state.equityCurve.push({
          index: i,
          capital: state.capital,
          time: currentCandle.timestamp,
          trade: trade.id
        });
        
        // Calcular drawdown
        if (state.capital > state.peakCapital) {
          state.peakCapital = state.capital;
        }
        const drawdown = (state.peakCapital - state.capital) / state.peakCapital;
        if (drawdown > 0) {
          state.drawdowns.push({ index: i, drawdown, time: currentCandle.timestamp });
        }
      }
    }
    
    // 2. Buscar novo sinal se não houver posição
    if (!state.position) {
      // Usar dados até o candle atual (simulação forward-looking prevention)
      const signalResult = calculateSignal(dataWindow, symbol, {});
      
      if (signalResult.hasSignal) {
        state.signals.generated++;
        
        // Validar se podemos abrir posição
        const positionSize = calculatePositionSize(
          state.capital,
          riskPerTrade,
          signalResult.signal.entryPrice,
          signalResult.signal.stopLoss
        );
        
        if (positionSize > 0 && state.capital > 100) {
          // Abrir posição com slippage
          const entryPrice = applySlippage(
            signalResult.signal.entryPrice,
            signalResult.signal.direction,
            slippage
          );
          
          state.position = {
            id: `BT-${Date.now()}-${i}`,
            direction: signalResult.signal.direction,
            type: signalResult.signal.type,
            entryPrice,
            originalEntry: signalResult.signal.entryPrice,
            takeProfit: signalResult.signal.takeProfit,
            stopLoss: signalResult.signal.stopLoss,
            size: positionSize,
            entryIndex: i,
            entryTime: currentCandle.timestamp,
            strength: signalResult.signal.strength,
            riskReward: signalResult.signal.riskReward
          };
          
          // Deduzir comissão de entrada
          state.capital -= positionSize * entryPrice * commission;
          state.signals.executed++;
        } else {
          state.signals.rejected++;
        }
      }
    }
    
    // 3. Snapshot periódico da equity curve (a cada 10 candles)
    if (i % 10 === 0 && !state.equityCurve.find(e => e.index === i)) {
      const unrealizedPnL = state.position ? 
        calculateUnrealizedPnL(state.position, currentCandle.close) : 0;
      
      state.equityCurve.push({
        index: i,
        capital: state.capital + unrealizedPnL,
        time: currentCandle.timestamp,
        unrealized: unrealizedPnL !== 0
      });
    }
  }

  // Fechar posição aberta no final (se houver)
  if (state.position) {
    const lastCandle = historicalData[end - 1];
    const forcedExit = {
      shouldExit: true,
      reason: 'end_of_data',
      exitPrice: lastCandle.close,
      profit: calculateProfitPercent(state.position, lastCandle.close)
    };
    const trade = closeTrade(state, lastCandle, forcedExit, commission, slippage);
    state.trades.push(trade);
  }

  // Calcular métricas finais
  const metrics = calculateBacktestMetrics(state, initialCapital, historicalData);

  return {
    success: true,
    symbol,
    period: {
      start: historicalData[start]?.timestamp,
      end: historicalData[end - 1]?.timestamp,
      candles: end - start
    },
    initialCapital,
    finalCapital: state.capital,
    metrics,
    trades: state.trades,
    equityCurve: state.equityCurve,
    signals: state.signals,
    config: {
      riskPerTrade,
      commission,
      slippage
    }
  };
};

/**
 * Simula verificação de saída
 */
const simulateExit = (position, candle, config) => {
  const { direction, takeProfit, stopLoss, entryPrice } = position;
  
  if (direction === 'buy') {
    // Verificar SL primeiro (pior caso)
    if (candle.low <= stopLoss) {
      return {
        shouldExit: true,
        reason: 'sl',
        exitPrice: stopLoss,
        profit: ((stopLoss - entryPrice) / entryPrice) * 100
      };
    }
    // Verificar TP
    if (candle.high >= takeProfit) {
      return {
        shouldExit: true,
        reason: 'tp',
        exitPrice: takeProfit,
        profit: ((takeProfit - entryPrice) / entryPrice) * 100
      };
    }
  } else {
    // VENDA
    if (candle.high >= stopLoss) {
      return {
        shouldExit: true,
        reason: 'sl',
        exitPrice: stopLoss,
        profit: ((entryPrice - stopLoss) / entryPrice) * 100
      };
    }
    if (candle.low <= takeProfit) {
      return {
        shouldExit: true,
        reason: 'tp',
        exitPrice: takeProfit,
        profit: ((entryPrice - takeProfit) / entryPrice) * 100
      };
    }
  }
  
  return { shouldExit: false };
};

/**
 * Fecha trade e atualiza capital
 */
const closeTrade = (state, candle, exitCheck, commission, slippage) => {
  const position = state.position;
  
  // Aplicar slippage na saída
  const exitPrice = applySlippage(
    exitCheck.exitPrice,
    position.direction === 'buy' ? 'sell' : 'buy', // Direção inversa para saída
    slippage
  );
  
  // Calcular P&L
  const pnlPercent = position.direction === 'buy'
    ? ((exitPrice - position.entryPrice) / position.entryPrice) * 100
    : ((position.entryPrice - exitPrice) / position.entryPrice) * 100;
  
  const pnlValue = (pnlPercent / 100) * position.size * position.entryPrice;
  
  // Deduzir comissão de saída
  const exitCommission = position.size * exitPrice * commission;
  
  // Atualizar capital
  state.capital += pnlValue - exitCommission;
  
  return {
    id: position.id,
    direction: position.direction,
    type: position.type,
    entryPrice: position.entryPrice,
    exitPrice,
    takeProfit: position.takeProfit,
    stopLoss: position.stopLoss,
    size: position.size,
    entryTime: position.entryTime,
    exitTime: candle.timestamp,
    entryIndex: position.entryIndex,
    exitIndex: state.equityCurve.length,
    duration: candle.timestamp - position.entryTime,
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    pnlValue: Math.round(pnlValue * 100) / 100,
    exitReason: exitCheck.reason,
    strength: position.strength,
    riskReward: position.riskReward,
    isWin: pnlPercent > 0
  };
};

/**
 * Calcula tamanho da posição baseado em risco
 */
const calculatePositionSize = (capital, riskPercent, entryPrice, stopLoss) => {
  const riskAmount = capital * riskPercent;
  const stopDistance = Math.abs(entryPrice - stopLoss);
  const stopPercent = stopDistance / entryPrice;
  
  if (stopPercent <= 0) return 0;
  
  // Quantidade que arriscamos riskAmount ao perder stopPercent
  const positionValue = riskAmount / stopPercent;
  const positionSize = positionValue / entryPrice;
  
  return Math.max(0, positionSize);
};

/**
 * Aplica slippage ao preço
 */
const applySlippage = (price, direction, slippagePercent) => {
  if (direction === 'buy') {
    return price * (1 + slippagePercent);
  } else {
    return price * (1 - slippagePercent);
  }
};

/**
 * Calcula P&L não realizado
 */
const calculateUnrealizedPnL = (position, currentPrice) => {
  const pnlPercent = position.direction === 'buy'
    ? ((currentPrice - position.entryPrice) / position.entryPrice)
    : ((position.entryPrice - currentPrice) / position.entryPrice);
  
  return pnlPercent * position.size * position.entryPrice;
};

/**
 * Calcula lucro percentual
 */
const calculateProfitPercent = (position, exitPrice) => {
  if (position.direction === 'buy') {
    return ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
  } else {
    return ((position.entryPrice - exitPrice) / position.entryPrice) * 100;
  }
};

/**
 * Calcula métricas completas do backtest
 */
const calculateBacktestMetrics = (state, initialCapital, historicalData) => {
  const trades = state.trades;
  
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalReturn: 0,
      annualizedReturn: 0
    };
  }

  // Métricas básicas
  const winningTrades = trades.filter(t => t.isWin);
  const losingTrades = trades.filter(t => !t.isWin);
  
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlValue, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlValue, 0));
  
  const winRate = (winningTrades.length / trades.length) * 100;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  
  const averageWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / winningTrades.length
    : 0;
  
  const averageLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / losingTrades.length)
    : 0;
  
  // Max drawdown
  const maxDrawdown = state.drawdowns.length > 0
    ? Math.max(...state.drawdowns.map(d => d.drawdown)) * 100
    : 0;
  
  // Retorno total
  const totalReturn = ((state.capital - initialCapital) / initialCapital) * 100;
  
  // Período em dias
  const periodMs = historicalData[historicalData.length - 1]?.timestamp - historicalData[0]?.timestamp;
  const periodDays = periodMs ? periodMs / (1000 * 60 * 60 * 24) : 1;
  
  // Retorno anualizado
  const annualizedReturn = periodDays > 0 
    ? ((1 + totalReturn / 100) ** (365 / periodDays) - 1) * 100
    : 0;
  
  // Sharpe Ratio (simplificado)
  const returns = trades.map(t => t.pnlPercent);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Anualizado
  
  // Expectativa matemática
  const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss;
  
  // Métricas adicionais
  const avgTradeDuration = trades.reduce((sum, t) => sum + t.duration, 0) / trades.length;
  const maxConsecutiveWins = calculateMaxConsecutive(trades, true);
  const maxConsecutiveLosses = calculateMaxConsecutive(trades, false);
  
  // Trades por direção
  const buyTrades = trades.filter(t => t.direction === 'buy');
  const sellTrades = trades.filter(t => t.direction === 'sell');
  
  const buyWinRate = buyTrades.length > 0
    ? (buyTrades.filter(t => t.isWin).length / buyTrades.length) * 100
    : 0;
  
  const sellWinRate = sellTrades.length > 0
    ? (sellTrades.filter(t => t.isWin).length / sellTrades.length) * 100
    : 0;

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Math.round(winRate * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    avgTradeDuration: Math.round(avgTradeDuration / (1000 * 60)), // em minutos
    maxConsecutiveWins,
    maxConsecutiveLosses,
    buyTrades: buyTrades.length,
    sellTrades: sellTrades.length,
    buyWinRate: Math.round(buyWinRate * 100) / 100,
    sellWinRate: Math.round(sellWinRate * 100) / 100,
    totalWins: Math.round(totalWins * 100) / 100,
    totalLosses: Math.round(totalLosses * 100) / 100,
    netProfit: Math.round((totalWins - totalLosses) * 100) / 100
  };
};

/**
 * Calcula máximo de trades consecutivos
 */
const calculateMaxConsecutive = (trades, isWin) => {
  let max = 0;
  let current = 0;
  
  for (const trade of trades) {
    if (trade.isWin === isWin) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  
  return max;
};

/**
 * Busca dados históricos estendidos da Binance
 */
export const fetchExtendedHistoricalData = async (symbol, interval = '15m', days = 30) => {
  const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
  
  // Calcular timestamps
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);
  
  // Binance limita a 1000 candles por request
  const allCandles = [];
  let currentStart = startTime;
  
  while (currentStart < endTime) {
    try {
      const response = await fetch(
        `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&startTime=${currentStart}&limit=1000`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) break;
      
      const candles = data.map(candle => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
      
      allCandles.push(...candles);
      
      // Próximo batch
      currentStart = candles[candles.length - 1].timestamp + 1;
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      break;
    }
  }
  
  // Remover duplicatas e ordenar
  const uniqueCandles = [...new Map(allCandles.map(c => [c.timestamp, c])).values()];
  uniqueCandles.sort((a, b) => a.timestamp - b.timestamp);
  
  return uniqueCandles;
};

export default {
  runBacktest,
  fetchExtendedHistoricalData
};
