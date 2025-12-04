/**
 * STRATEGY ENGINE - ÍNDICE
 * Exporta todos os módulos do motor de estratégia
 */

export { default as indicators } from './core/indicators';
export { default as scoring } from './core/scoring';
export { default as breakout } from './core/breakout';
export { default as riskManagement } from './core/riskManagement';
export { default as signalEngine, calculateSignal, checkExitConditions, prepareIndicators } from './core/signalEngine';

// Re-export das funções principais
export {
  calculateEMA,
  calculateATR,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateOBV,
  detectSwings
} from './core/indicators';

export {
  detectMarketRegime,
  calculateTotalScore
} from './core/scoring';

export {
  validateBreakout,
  calculateBreakoutStrength
} from './core/breakout';

export {
  calculateRiskLevels,
  calculateDynamicBreakEven,
  checkTPSL
} from './core/riskManagement';
