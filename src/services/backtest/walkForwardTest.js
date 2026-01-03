/**
 * WALK-FORWARD TESTING
 * Validação estatística robusta com janelas separadas
 * Separa resultados long vs short
 */

import { runBacktest } from './backtestEngine';
import { runMonteCarloSimulation, bootstrapWinRate } from './monteCarloSimulation';
import { APPROVAL_CRITERIA, getAllVersions } from '@/config/strategyConfig';

/**
 * Executa walk-forward test com múltiplas janelas
 * @param {Array} historicalData - Dados históricos
 * @param {string} symbol - Par de trading
 * @param {Object} options - Opções de teste
 */
export const runWalkForwardTest = (historicalData, symbol, options = {}) => {
  const {
    numWindows = 3,
    trainingRatio = 0.7, // 70% treino, 30% teste
    initialCapital = 10000,
    riskPerTrade = 0.02,
    commission = 0.001,
    slippage = 0.0005
  } = options;

  if (!historicalData || historicalData.length < 200) {
    return {
      success: false,
      error: 'Dados insuficientes para walk-forward (mínimo 200 candles)'
    };
  }

  const totalCandles = historicalData.length;
  const windowSize = Math.floor(totalCandles / numWindows);
  
  const windowResults = [];
  
  for (let w = 0; w < numWindows; w++) {
    const windowStart = w * windowSize;
    const windowEnd = Math.min((w + 1) * windowSize, totalCandles);
    const windowData = historicalData.slice(windowStart, windowEnd);
    
    // Separar treino e teste
    const splitIndex = Math.floor(windowData.length * trainingRatio);
    const trainData = windowData.slice(0, splitIndex);
    const testData = windowData.slice(splitIndex);
    
    // Executar backtest no período de teste (out-of-sample)
    const backtestResult = runBacktest(testData, symbol, {
      initialCapital,
      riskPerTrade,
      commission,
      slippage,
      minDataPoints: 50 // Reduzido para janelas menores
    });
    
    if (backtestResult.success) {
      // Separar trades long vs short
      const longTrades = backtestResult.trades.filter(t => t.direction === 'buy');
      const shortTrades = backtestResult.trades.filter(t => t.direction === 'sell');
      
      const longWinRate = longTrades.length > 0
        ? (longTrades.filter(t => t.isWin).length / longTrades.length) * 100
        : 0;
      
      const shortWinRate = shortTrades.length > 0
        ? (shortTrades.filter(t => t.isWin).length / shortTrades.length) * 100
        : 0;
      
      windowResults.push({
        window: w + 1,
        period: {
          start: windowData[0]?.timestamp,
          end: windowData[windowData.length - 1]?.timestamp,
          trainCandles: trainData.length,
          testCandles: testData.length
        },
        metrics: backtestResult.metrics,
        longTrades: longTrades.length,
        shortTrades: shortTrades.length,
        longWinRate: Math.round(longWinRate * 100) / 100,
        shortWinRate: Math.round(shortWinRate * 100) / 100,
        passed: evaluateWindowCriteria(backtestResult.metrics)
      });
    } else {
      windowResults.push({
        window: w + 1,
        error: backtestResult.error,
        passed: false
      });
    }
  }
  
  // Calcular métricas agregadas
  const successfulWindows = windowResults.filter(w => !w.error);
  const passedWindows = successfulWindows.filter(w => w.passed);
  
  const aggregateMetrics = calculateAggregateMetrics(successfulWindows);
  
  // Verificar critérios de aprovação
  const approval = evaluateApprovalCriteria(aggregateMetrics, windowResults);
  
  return {
    success: true,
    summary: {
      numWindows,
      successfulWindows: successfulWindows.length,
      passedWindows: passedWindows.length,
      overallPassed: approval.passed
    },
    windows: windowResults,
    aggregateMetrics,
    approval,
    criteria: APPROVAL_CRITERIA
  };
};

/**
 * Avalia se uma janela individual passou nos critérios
 */
const evaluateWindowCriteria = (metrics) => {
  return (
    metrics.winRate >= APPROVAL_CRITERIA.minWinRatePerWindow * 100 &&
    metrics.profitFactor >= 1.0 &&
    metrics.totalTrades >= 5
  );
};

/**
 * Calcula métricas agregadas de todas as janelas
 */
const calculateAggregateMetrics = (windows) => {
  if (windows.length === 0) {
    return null;
  }
  
  const totalTrades = windows.reduce((sum, w) => sum + (w.metrics?.totalTrades || 0), 0);
  const totalWins = windows.reduce((sum, w) => sum + (w.metrics?.winningTrades || 0), 0);
  const totalLosses = windows.reduce((sum, w) => sum + (w.metrics?.losingTrades || 0), 0);
  
  const avgWinRate = windows.reduce((sum, w) => sum + (w.metrics?.winRate || 0), 0) / windows.length;
  const avgProfitFactor = windows.reduce((sum, w) => sum + (w.metrics?.profitFactor || 0), 0) / windows.length;
  const avgSharpe = windows.reduce((sum, w) => sum + (w.metrics?.sharpeRatio || 0), 0) / windows.length;
  const maxDrawdown = Math.max(...windows.map(w => w.metrics?.maxDrawdown || 0));
  const avgExpectancy = windows.reduce((sum, w) => sum + (w.metrics?.expectancy || 0), 0) / windows.length;
  
  // Métricas por direção
  const totalLongTrades = windows.reduce((sum, w) => sum + (w.longTrades || 0), 0);
  const totalShortTrades = windows.reduce((sum, w) => sum + (w.shortTrades || 0), 0);
  const avgLongWinRate = windows.reduce((sum, w) => sum + (w.longWinRate || 0), 0) / windows.length;
  const avgShortWinRate = windows.reduce((sum, w) => sum + (w.shortWinRate || 0), 0) / windows.length;
  
  // Desvio padrão do win rate (consistência entre janelas)
  const winRates = windows.map(w => w.metrics?.winRate || 0);
  const winRateStd = Math.sqrt(
    winRates.reduce((sum, r) => sum + Math.pow(r - avgWinRate, 2), 0) / windows.length
  );
  
  return {
    totalTrades,
    totalWins,
    totalLosses,
    avgWinRate: Math.round(avgWinRate * 100) / 100,
    avgProfitFactor: Math.round(avgProfitFactor * 100) / 100,
    avgSharpe: Math.round(avgSharpe * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    avgExpectancy: Math.round(avgExpectancy * 100) / 100,
    totalLongTrades,
    totalShortTrades,
    avgLongWinRate: Math.round(avgLongWinRate * 100) / 100,
    avgShortWinRate: Math.round(avgShortWinRate * 100) / 100,
    winRateStd: Math.round(winRateStd * 100) / 100,
    consistency: winRateStd < 10 ? 'high' : winRateStd < 20 ? 'medium' : 'low'
  };
};

/**
 * Avalia critérios gerais de aprovação
 */
const evaluateApprovalCriteria = (aggregateMetrics, windowResults) => {
  const criteria = APPROVAL_CRITERIA;
  const checks = [];
  
  if (!aggregateMetrics) {
    return { passed: false, reason: 'Sem métricas disponíveis', checks: [] };
  }
  
  // 1. Profit Factor >= 1.3
  const pfCheck = {
    name: 'Profit Factor',
    required: criteria.minProfitFactor,
    actual: aggregateMetrics.avgProfitFactor,
    passed: aggregateMetrics.avgProfitFactor >= criteria.minProfitFactor
  };
  checks.push(pfCheck);
  
  // 2. Sharpe >= 0.5
  const sharpeCheck = {
    name: 'Sharpe Ratio',
    required: criteria.minSharpe,
    actual: aggregateMetrics.avgSharpe,
    passed: aggregateMetrics.avgSharpe >= criteria.minSharpe
  };
  checks.push(sharpeCheck);
  
  // 3. Max Drawdown <= 30%
  const ddCheck = {
    name: 'Max Drawdown',
    required: `<= ${criteria.maxDrawdown * 100}%`,
    actual: `${aggregateMetrics.maxDrawdown}%`,
    passed: aggregateMetrics.maxDrawdown <= criteria.maxDrawdown * 100
  };
  checks.push(ddCheck);
  
  // 4. Win Rate >= 60% (probabilidade de lucro)
  const wrCheck = {
    name: 'Win Rate',
    required: `>= ${criteria.minProfitProbability * 100}%`,
    actual: `${aggregateMetrics.avgWinRate}%`,
    passed: aggregateMetrics.avgWinRate >= criteria.minProfitProbability * 100
  };
  checks.push(wrCheck);
  
  // 5. Mínimo de trades
  const tradesCheck = {
    name: 'Mínimo de Trades',
    required: criteria.minTrades,
    actual: aggregateMetrics.totalTrades,
    passed: aggregateMetrics.totalTrades >= criteria.minTrades
  };
  checks.push(tradesCheck);
  
  // 6. Todas as janelas passaram
  const passedWindows = windowResults.filter(w => w.passed).length;
  const windowsCheck = {
    name: 'Janelas Aprovadas',
    required: `>= ${Math.ceil(windowResults.length * 0.66)}/${windowResults.length}`,
    actual: `${passedWindows}/${windowResults.length}`,
    passed: passedWindows >= Math.ceil(windowResults.length * 0.66)
  };
  checks.push(windowsCheck);
  
  const allPassed = checks.every(c => c.passed);
  
  return {
    passed: allPassed,
    passedCount: checks.filter(c => c.passed).length,
    totalChecks: checks.length,
    checks
  };
};

/**
 * Executa validação completa com Walk-Forward + Monte Carlo
 */
export const runFullValidation = async (historicalData, symbol, options = {}) => {
  const {
    numWindows = 3,
    monteCarloPermutations = 1000,
    initialCapital = 10000
  } = options;
  
  // 1. Walk-Forward Test
  const walkForward = runWalkForwardTest(historicalData, symbol, {
    numWindows,
    initialCapital,
    ...options
  });
  
  if (!walkForward.success) {
    return {
      success: false,
      error: walkForward.error,
      stage: 'walk-forward'
    };
  }
  
  // 2. Coletar todos os trades das janelas
  const allTrades = walkForward.windows
    .filter(w => !w.error)
    .flatMap(w => w.trades || []);
  
  // 3. Monte Carlo (se houver trades suficientes)
  let monteCarlo = null;
  if (allTrades.length >= 10) {
    // Precisamos do backtest completo para pegar os trades
    const fullBacktest = runBacktest(historicalData, symbol, {
      initialCapital,
      ...options
    });
    
    if (fullBacktest.success && fullBacktest.trades.length >= 5) {
      monteCarlo = runMonteCarloSimulation(fullBacktest.trades, {
        numSimulations: monteCarloPermutations,
        initialCapital
      });
    }
  }
  
  // 4. Bootstrap Win Rate
  let bootstrap = null;
  if (allTrades.length >= 10) {
    const fullBacktest = runBacktest(historicalData, symbol, {
      initialCapital,
      ...options
    });
    
    if (fullBacktest.success) {
      bootstrap = bootstrapWinRate(fullBacktest.trades, 1000);
    }
  }
  
  // 5. Avaliação final
  const finalApproval = evaluateFinalApproval(walkForward, monteCarlo);
  
  return {
    success: true,
    walkForward,
    monteCarlo,
    bootstrap,
    finalApproval,
    recommendation: generateRecommendation(finalApproval)
  };
};

/**
 * Avalia aprovação final combinando Walk-Forward e Monte Carlo
 */
const evaluateFinalApproval = (walkForward, monteCarlo) => {
  const criteria = APPROVAL_CRITERIA;
  const checks = [];
  
  // Checks do Walk-Forward
  if (walkForward.approval) {
    checks.push(...walkForward.approval.checks);
  }
  
  // Checks do Monte Carlo
  if (monteCarlo?.success) {
    // Pior cenário 5%
    const worstCase = monteCarlo.returns?.percentiles?.p5 || 0;
    checks.push({
      name: 'Pior Cenário (5%)',
      required: `>= ${criteria.maxWorstCase5Percent * 100}%`,
      actual: `${worstCase}%`,
      passed: worstCase >= criteria.maxWorstCase5Percent * 100
    });
    
    // Probabilidade de lucro
    const probProfit = monteCarlo.risk?.probProfit || 0;
    checks.push({
      name: 'Prob. de Lucro (MC)',
      required: `>= ${criteria.minProfitProbability * 100}%`,
      actual: `${probProfit}%`,
      passed: probProfit >= criteria.minProfitProbability * 100
    });
    
    // Probabilidade de ruína
    const probRuin = monteCarlo.risk?.probRuin || 0;
    checks.push({
      name: 'Prob. de Ruína (MC)',
      required: `<= ${criteria.maxRuinProbability * 100}%`,
      actual: `${probRuin}%`,
      passed: probRuin <= criteria.maxRuinProbability * 100
    });
  }
  
  const passedCount = checks.filter(c => c.passed).length;
  const allPassed = checks.every(c => c.passed);
  
  return {
    passed: allPassed,
    passedCount,
    totalChecks: checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks
  };
};

/**
 * Gera recomendação baseada na aprovação
 */
const generateRecommendation = (approval) => {
  if (approval.passed) {
    return {
      status: 'APROVADO',
      message: 'Estratégia passou em todos os critérios de validação.',
      action: 'Pode prosseguir com cautela para operações reais.',
      riskLevel: 'BAIXO'
    };
  }
  
  const score = approval.score;
  
  if (score >= 80) {
    return {
      status: 'APROVADO COM RESSALVAS',
      message: `Estratégia passou em ${score}% dos critérios.`,
      action: 'Revisar critérios não atendidos antes de operar.',
      riskLevel: 'MÉDIO'
    };
  }
  
  if (score >= 60) {
    return {
      status: 'REVISÃO NECESSÁRIA',
      message: `Estratégia passou em apenas ${score}% dos critérios.`,
      action: 'Ajustar parâmetros e re-validar antes de operar.',
      riskLevel: 'ALTO'
    };
  }
  
  return {
    status: 'REPROVADO',
    message: `Estratégia passou em apenas ${score}% dos critérios.`,
    action: 'Não recomendado para operações reais. Revisar lógica fundamental.',
    riskLevel: 'MUITO ALTO'
  };
};

/**
 * Compara múltiplas versões da estratégia (A/B Testing)
 */
export const compareVersions = async (historicalData, symbol, options = {}) => {
  const versions = getAllVersions();
  const results = [];
  
  for (const version of versions) {
    if (version.frozen) continue; // Pular baseline congelado
    
    // Executar backtest para cada versão
    const backtest = runBacktest(historicalData, symbol, {
      ...options,
      customConfig: version.config
    });
    
    if (backtest.success) {
      results.push({
        versionId: version.id,
        label: version.label,
        description: version.config.description,
        metrics: backtest.metrics,
        trades: backtest.trades.length
      });
    }
  }
  
  // Ordenar por expectativa e profit factor
  results.sort((a, b) => {
    const scoreA = (a.metrics.expectancy || 0) + (a.metrics.profitFactor || 0);
    const scoreB = (b.metrics.expectancy || 0) + (b.metrics.profitFactor || 0);
    return scoreB - scoreA;
  });
  
  return {
    success: true,
    results,
    bestVersion: results[0] || null,
    comparison: generateComparisonTable(results)
  };
};

/**
 * Gera tabela de comparação entre versões
 */
const generateComparisonTable = (results) => {
  if (results.length === 0) return null;
  
  return results.map(r => ({
    version: r.versionId,
    label: r.label,
    trades: r.trades,
    winRate: `${r.metrics.winRate}%`,
    pf: r.metrics.profitFactor,
    sharpe: r.metrics.sharpeRatio,
    expectancy: r.metrics.expectancy,
    maxDD: `${r.metrics.maxDrawdown}%`
  }));
};

export default {
  runWalkForwardTest,
  runFullValidation,
  compareVersions
};
