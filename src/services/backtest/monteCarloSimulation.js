/**
 * MONTE CARLO SIMULATION
 * Análise estatística de risco e probabilidade da estratégia
 * usando simulações de Monte Carlo para estimar distribuição de resultados
 */

/**
 * Executa simulação Monte Carlo baseada nos trades do backtest
 * @param {Array} trades - Trades do backtest
 * @param {Object} options - Opções de simulação
 * @returns {Object} Resultados da simulação
 */
export const runMonteCarloSimulation = (trades, options = {}) => {
  const {
    numSimulations = 1000,
    numTrades = null, // null = usar tamanho original
    initialCapital = 10000,
    confidenceLevels = [0.05, 0.25, 0.50, 0.75, 0.95]
  } = options;

  if (!trades || trades.length < 5) {
    return {
      success: false,
      error: 'Mínimo de 5 trades necessários para simulação Monte Carlo'
    };
  }

  const tradesToSimulate = numTrades || trades.length;
  const tradeReturns = trades.map(t => t.pnlPercent / 100);
  
  // Executar simulações
  const simulations = [];
  const finalReturns = [];
  const maxDrawdowns = [];
  const winRates = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const simulation = runSingleSimulation(
      tradeReturns,
      tradesToSimulate,
      initialCapital
    );
    
    simulations.push(simulation);
    finalReturns.push(simulation.finalReturn);
    maxDrawdowns.push(simulation.maxDrawdown);
    winRates.push(simulation.winRate);
  }

  // Ordenar resultados
  finalReturns.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);
  
  // Calcular percentis
  const returnPercentiles = {};
  const drawdownPercentiles = {};
  
  for (const level of confidenceLevels) {
    const idx = Math.floor(level * numSimulations);
    returnPercentiles[`p${level * 100}`] = Math.round(finalReturns[idx] * 100) / 100;
    drawdownPercentiles[`p${level * 100}`] = Math.round(maxDrawdowns[idx] * 100) / 100;
  }

  // Estatísticas de retorno
  const avgReturn = finalReturns.reduce((a, b) => a + b, 0) / numSimulations;
  const stdReturn = Math.sqrt(
    finalReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / numSimulations
  );
  
  // Value at Risk (VaR)
  const var95 = finalReturns[Math.floor(0.05 * numSimulations)];
  const var99 = finalReturns[Math.floor(0.01 * numSimulations)];
  
  // Conditional VaR (Expected Shortfall)
  const var95Index = Math.floor(0.05 * numSimulations);
  const cvar95 = finalReturns.slice(0, var95Index).reduce((a, b) => a + b, 0) / var95Index;
  
  // Probabilidades
  const probProfit = finalReturns.filter(r => r > 0).length / numSimulations;
  const probLoss = 1 - probProfit;
  const probRuin = finalReturns.filter(r => r <= -50).length / numSimulations; // 50% loss = ruína
  const probDoubling = finalReturns.filter(r => r >= 100).length / numSimulations;
  
  // Distribuição de resultados
  const distribution = calculateDistribution(finalReturns, 20);
  
  // Win rate médio e desvio
  const avgWinRate = winRates.reduce((a, b) => a + b, 0) / numSimulations;
  const stdWinRate = Math.sqrt(
    winRates.reduce((sum, r) => sum + Math.pow(r - avgWinRate, 2), 0) / numSimulations
  );
  
  // Drawdown esperado
  const avgMaxDrawdown = maxDrawdowns.reduce((a, b) => a + b, 0) / numSimulations;
  const worstDrawdown = Math.max(...maxDrawdowns);

  // Métricas de risco-retorno
  const sortinoRatio = calculateSortinoRatio(finalReturns);
  const calmarRatio = avgMaxDrawdown > 0 ? avgReturn / avgMaxDrawdown : 0;
  
  // Análise de sequências
  const streakAnalysis = analyzeWinLossStreaks(trades, numSimulations);

  return {
    success: true,
    summary: {
      numSimulations,
      numTrades: tradesToSimulate,
      baseTrades: trades.length,
      initialCapital
    },
    returns: {
      mean: Math.round(avgReturn * 100) / 100,
      median: Math.round(finalReturns[Math.floor(numSimulations / 2)] * 100) / 100,
      std: Math.round(stdReturn * 100) / 100,
      min: Math.round(Math.min(...finalReturns) * 100) / 100,
      max: Math.round(Math.max(...finalReturns) * 100) / 100,
      percentiles: returnPercentiles
    },
    drawdown: {
      mean: Math.round(avgMaxDrawdown * 100) / 100,
      worst: Math.round(worstDrawdown * 100) / 100,
      percentiles: drawdownPercentiles
    },
    risk: {
      var95: Math.round(var95 * 100) / 100,
      var99: Math.round(var99 * 100) / 100,
      cvar95: Math.round(cvar95 * 100) / 100,
      probProfit: Math.round(probProfit * 10000) / 100,
      probLoss: Math.round(probLoss * 10000) / 100,
      probRuin: Math.round(probRuin * 10000) / 100,
      probDoubling: Math.round(probDoubling * 10000) / 100
    },
    winRate: {
      mean: Math.round(avgWinRate * 100) / 100,
      std: Math.round(stdWinRate * 100) / 100,
      confidence95: {
        lower: Math.round((avgWinRate - 1.96 * stdWinRate) * 100) / 100,
        upper: Math.round((avgWinRate + 1.96 * stdWinRate) * 100) / 100
      }
    },
    ratios: {
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      calmarRatio: Math.round(calmarRatio * 100) / 100
    },
    distribution,
    streakAnalysis,
    rawSimulations: simulations.slice(0, 100) // Primeiras 100 para visualização
  };
};

/**
 * Executa uma única simulação
 */
const runSingleSimulation = (tradeReturns, numTrades, initialCapital) => {
  let capital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  let wins = 0;
  
  const equityCurve = [capital];
  
  for (let i = 0; i < numTrades; i++) {
    // Selecionar trade aleatório (com reposição)
    const randomIdx = Math.floor(Math.random() * tradeReturns.length);
    const tradeReturn = tradeReturns[randomIdx];
    
    // Aplicar retorno
    capital = capital * (1 + tradeReturn);
    
    // Contar vitórias
    if (tradeReturn > 0) wins++;
    
    // Atualizar peak e drawdown
    if (capital > peakCapital) {
      peakCapital = capital;
    }
    const currentDrawdown = (peakCapital - capital) / peakCapital;
    maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
    
    equityCurve.push(capital);
  }
  
  const finalReturn = ((capital - initialCapital) / initialCapital) * 100;
  
  return {
    finalCapital: capital,
    finalReturn,
    maxDrawdown: maxDrawdown * 100,
    winRate: (wins / numTrades) * 100,
    equityCurve
  };
};

/**
 * Calcula distribuição em buckets
 */
const calculateDistribution = (values, numBuckets) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const bucketSize = range / numBuckets;
  
  const buckets = Array(numBuckets).fill(0);
  const labels = [];
  
  for (let i = 0; i < numBuckets; i++) {
    const start = min + i * bucketSize;
    const end = start + bucketSize;
    labels.push(`${Math.round(start)}% - ${Math.round(end)}%`);
  }
  
  for (const value of values) {
    const idx = Math.min(
      Math.floor((value - min) / bucketSize),
      numBuckets - 1
    );
    buckets[idx]++;
  }
  
  return {
    labels,
    counts: buckets,
    frequencies: buckets.map(c => Math.round((c / values.length) * 10000) / 100)
  };
};

/**
 * Calcula Sortino Ratio
 */
const calculateSortinoRatio = (returns, riskFreeRate = 0) => {
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const excessReturn = meanReturn - riskFreeRate;
  
  // Downside deviation - apenas retornos negativos
  const negativeReturns = returns.filter(r => r < riskFreeRate);
  
  if (negativeReturns.length === 0) return Infinity;
  
  const downsideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / negativeReturns.length
  );
  
  return downsideDeviation > 0 ? excessReturn / downsideDeviation : 0;
};

/**
 * Analisa sequências de vitórias/derrotas
 */
const analyzeWinLossStreaks = (trades, numSimulations) => {
  // Estatísticas originais
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let lastResult = null;
  
  for (const trade of trades) {
    const isWin = trade.pnlPercent > 0;
    
    if (lastResult === isWin) {
      currentStreak++;
    } else {
      if (lastResult === true) {
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else if (lastResult === false) {
        maxLossStreak = Math.max(maxLossStreak, currentStreak);
      }
      currentStreak = 1;
    }
    lastResult = isWin;
  }
  
  // Simular distribuição de streaks
  const winStreaks = [];
  const lossStreaks = [];
  
  for (let sim = 0; sim < Math.min(numSimulations, 500); sim++) {
    const shuffled = [...trades].sort(() => Math.random() - 0.5);
    let streak = 0;
    let maxWin = 0;
    let maxLoss = 0;
    let last = null;
    
    for (const t of shuffled) {
      const isWin = t.pnlPercent > 0;
      if (last === isWin) {
        streak++;
      } else {
        if (last === true) maxWin = Math.max(maxWin, streak);
        else if (last === false) maxLoss = Math.max(maxLoss, streak);
        streak = 1;
      }
      last = isWin;
    }
    winStreaks.push(maxWin);
    lossStreaks.push(maxLoss);
  }
  
  const avgWinStreak = winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length;
  const avgLossStreak = lossStreaks.reduce((a, b) => a + b, 0) / lossStreaks.length;
  
  return {
    actual: {
      maxWinStreak,
      maxLossStreak
    },
    simulated: {
      avgWinStreak: Math.round(avgWinStreak * 10) / 10,
      avgLossStreak: Math.round(avgLossStreak * 10) / 10,
      maxWinStreak: Math.max(...winStreaks),
      maxLossStreak: Math.max(...lossStreaks)
    }
  };
};

/**
 * Análise de sensibilidade - testa diferentes parâmetros
 */
export const runSensitivityAnalysis = (trades, paramRanges = {}) => {
  const {
    riskPerTrade = [0.01, 0.02, 0.03, 0.05],
    tradesToSimulate = null
  } = paramRanges;
  
  const results = [];
  
  for (const risk of riskPerTrade) {
    const simulation = runMonteCarloSimulation(trades, {
      numSimulations: 500,
      numTrades: tradesToSimulate || trades.length,
      initialCapital: 10000
    });
    
    if (simulation.success) {
      results.push({
        riskPerTrade: risk,
        expectedReturn: simulation.returns.mean,
        maxDrawdown: simulation.drawdown.mean,
        probProfit: simulation.risk.probProfit,
        probRuin: simulation.risk.probRuin,
        winRate: simulation.winRate.mean
      });
    }
  }
  
  return results;
};

/**
 * Bootstrap para intervalo de confiança da win rate
 */
export const bootstrapWinRate = (trades, numBootstrap = 1000) => {
  const winRates = [];
  
  for (let i = 0; i < numBootstrap; i++) {
    // Amostragem com reposição
    const sample = [];
    for (let j = 0; j < trades.length; j++) {
      const idx = Math.floor(Math.random() * trades.length);
      sample.push(trades[idx]);
    }
    
    const wins = sample.filter(t => t.pnlPercent > 0).length;
    winRates.push(wins / sample.length);
  }
  
  winRates.sort((a, b) => a - b);
  
  const mean = winRates.reduce((a, b) => a + b, 0) / numBootstrap;
  const ci95Lower = winRates[Math.floor(0.025 * numBootstrap)];
  const ci95Upper = winRates[Math.floor(0.975 * numBootstrap)];
  
  return {
    mean: Math.round(mean * 10000) / 100,
    confidence95: {
      lower: Math.round(ci95Lower * 10000) / 100,
      upper: Math.round(ci95Upper * 10000) / 100
    },
    distribution: winRates.map(r => Math.round(r * 10000) / 100)
  };
};

export default {
  runMonteCarloSimulation,
  runSensitivityAnalysis,
  bootstrapWinRate
};
