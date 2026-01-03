/**
 * STRATEGY ENGINE - ÍNDICE
 * Exporta todos os módulos do motor de estratégia
 * Inclui engine simplificado v1.1+
 */

export { default as indicators } from './core/indicators';
export { default as scoring } from './core/scoring';
export { default as breakout } from './core/breakout';
export { default as riskManagement } from './core/riskManagement';
export { default as signalEngine, calculateSignal, checkExitConditions, prepareIndicators } from './core/signalEngine';

// Engine simplificado v1.1+
export { 
  default as signalEngineSimplified,
  generateSimplifiedSignal,
  prepareSimplifiedIndicators,
  calculateFixedTPSL
} from './core/signalEngineSimplified';

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

// Config exports
export {
  getActiveConfig,
  getAllVersions,
  APPROVAL_CRITERIA,
  STRATEGY_V1_1,
  STRATEGY_V1_2,
  STRATEGY_V1_3,
  STRATEGY_V1_4,
  STRATEGY_V1_0_BASELINE
} from '@/config/strategyConfig';
