/**
 * Simulação de Monte Carlo e cálculo de risco de ruína
 * 1000 simulações, bootstrapping
 */

import type { Trade, BacktestResult, MonteCarloResult, ValidationResult } from './types';

/**
 * Executa simulação de Monte Carlo via bootstrapping
 * Embaralha a sequência de trades e calcula retorno final
 */
export function monteCarloSimulation(
  trades: Trade[],
  initialCapital: number,
  simulations: number = 1000
): MonteCarloResult {
  if (trades.length === 0) {
    return {
      simulations: [],
      median: 0,
      worst5Percent: 0,
      best5Percent: 0,
      riskOfRuin: 1,
      confidenceInterval95: [0, 0]
    };
  }
  
  const results: number[] = [];
  const ruinThreshold = initialCapital * 0.5; // Ruína = perder 50%
  let ruinCount = 0;
  
  for (let sim = 0; sim < simulations; sim++) {
    // Cria sequência embaralhada (Fisher-Yates)
    const shuffled = [...trades];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Simula equity curve
    let capital = initialCapital;
    let minCapital = initialCapital;
    
    for (const trade of shuffled) {
      const riskAmount = initialCapital * 0.01; // 1% risco fixo
      const pnl = trade.profitR * riskAmount;
      capital += pnl;
      minCapital = Math.min(minCapital, capital);
      
      // Verifica ruína
      if (capital <= ruinThreshold) {
        ruinCount++;
        break;
      }
    }
    
    results.push(capital);
  }
  
  // Ordena para percentis
  results.sort((a, b) => a - b);
  
  const median = results[Math.floor(results.length / 2)];
  const worst5Idx = Math.floor(results.length * 0.05);
  const best5Idx = Math.floor(results.length * 0.95);
  const worst5Percent = results[worst5Idx];
  const best5Percent = results[best5Idx];
  
  const lowerCI = results[Math.floor(results.length * 0.025)];
  const upperCI = results[Math.floor(results.length * 0.975)];
  
  return {
    simulations: results,
    median,
    worst5Percent,
    best5Percent,
    riskOfRuin: ruinCount / simulations,
    confidenceInterval95: [lowerCI, upperCI]
  };
}

/**
 * Calcula risco de ruína usando fórmula analítica
 * R = ((1 - E) / (1 + E))^N
 * Onde E = edge, N = unidades de capital
 */
export function calculateRiskOfRuin(
  winRate: number,
  avgWinLossRatio: number,
  capitalUnits: number = 100
): number {
  // Edge = (winRate * avgWinLossRatio) - (1 - winRate)
  const edge = (winRate * avgWinLossRatio) - (1 - winRate);
  
  if (edge <= 0) return 1; // 100% risco de ruína
  if (edge >= 1) return 0; // 0% risco de ruína
  
  // Risco de ruína
  const ruin = Math.pow((1 - edge) / (1 + edge), capitalUnits);
  
  return Math.min(1, Math.max(0, ruin));
}

/**
 * Valida estratégia com critérios definidos
 */
export function finalValidator(
  backtest: BacktestResult,
  monteCarlo: MonteCarloResult,
  initialCapital: number
): ValidationResult {
  const criteria = {
    expectancy: {
      value: backtest.expectancy,
      threshold: 0.15,
      passed: backtest.expectancy >= 0.15
    },
    profitFactor: {
      value: backtest.profitFactor,
      threshold: 1.3,
      passed: backtest.profitFactor >= 1.3
    },
    maxDrawdown: {
      value: backtest.maxDrawdown * 100,
      threshold: 25,
      passed: backtest.maxDrawdown <= 0.25
    },
    winRate: {
      value: backtest.winRate * 100,
      threshold: 35,
      passed: backtest.winRate >= 0.35
    },
    monteCarloMedian: {
      value: monteCarlo.median,
      threshold: initialCapital,
      passed: monteCarlo.median >= initialCapital
    },
    monteCarloWorst5: {
      value: ((monteCarlo.worst5Percent - initialCapital) / initialCapital) * 100,
      threshold: -30,
      passed: ((monteCarlo.worst5Percent - initialCapital) / initialCapital) * 100 >= -30
    },
    riskOfRuin: {
      value: monteCarlo.riskOfRuin * 100,
      threshold: 5,
      passed: monteCarlo.riskOfRuin <= 0.05
    }
  };
  
  const passedCount = Object.values(criteria).filter(c => c.passed).length;
  const totalCriteria = Object.keys(criteria).length;
  
  let status: ValidationResult['status'];
  if (passedCount === totalCriteria) {
    status = 'APROVADA';
  } else if (passedCount >= totalCriteria - 2) {
    status = 'QUASE';
  } else {
    status = 'REPROVADA';
  }
  
  return {
    approved: status === 'APROVADA',
    status,
    criteria,
    passedCount,
    totalCriteria
  };
}

/**
 * Gera sinais para usuário
 */
export function generateUserSignals(
  hasActivePattern: boolean,
  patternType: 'bullish' | 'bearish' | null,
  hasActiveTrade: boolean
): { status: 'waiting' | 'buy' | 'sell' | 'managing'; message: string } {
  if (hasActiveTrade) {
    return {
      status: 'managing',
      message: 'Em gestão - acompanhando trade ativo'
    };
  }
  
  if (hasActivePattern && patternType) {
    return {
      status: patternType === 'bullish' ? 'buy' : 'sell',
      message: `${patternType === 'bullish' ? 'Compra' : 'Venda'} detectada - padrão harmônico confirmado`
    };
  }
  
  return {
    status: 'waiting',
    message: 'Aguarde entrada - buscando padrões válidos'
  };
}
