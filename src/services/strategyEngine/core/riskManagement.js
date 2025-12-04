/**
 * MÓDULO DE GESTÃO DE RISCO
 * SL/TP baseados em ATR e pernada
 * Position sizing, break-even dinâmico
 */

/**
 * Calcula SL/TP baseado em ATR e força do ADX
 */
export const calculateRiskLevels = (entryPrice, atr, adx, swings, direction, config) => {
  const { slMultiplierByADX, tpMultiplierByADX, slRange, minRiskReward } = config.risk;
  
  // Determinar regime de ADX
  let adxRegime = 'weak';
  if (adx >= 40) adxRegime = 'strong';
  else if (adx >= 30) adxRegime = 'moderate';
  
  const slConfig = slMultiplierByADX[adxRegime];
  const tpConfig = tpMultiplierByADX[adxRegime];
  
  // Calcular pernada (leg) se swings disponíveis
  let legSize = 0;
  if (swings.swingHigh && swings.swingLow) {
    legSize = Math.abs(swings.swingHigh.value - swings.swingLow.value);
  }
  
  // Calcular SL
  let sl;
  if (legSize > 0) {
    // Baseado na pernada + Fibonacci
    sl = direction === 'buy'
      ? swings.swingLow.value - (legSize * slConfig.legFib * 0.1)
      : swings.swingHigh.value + (legSize * slConfig.legFib * 0.1);
  } else {
    // Fallback: baseado em ATR
    sl = direction === 'buy'
      ? entryPrice - (atr * slConfig.atr)
      : entryPrice + (atr * slConfig.atr);
  }
  
  // Calcular TP
  let tp;
  if (legSize > 0) {
    tp = direction === 'buy'
      ? entryPrice + (legSize * tpConfig.legFib)
      : entryPrice - (legSize * tpConfig.legFib);
  } else {
    tp = direction === 'buy'
      ? entryPrice + (atr * tpConfig.atr)
      : entryPrice - (atr * tpConfig.atr);
  }
  
  // Validar range de SL
  const slDistance = Math.abs(entryPrice - sl);
  const slPercentage = (slDistance / entryPrice) * 100;
  
  if (slPercentage < slRange.min) {
    sl = direction === 'buy'
      ? entryPrice * (1 - slRange.min / 100)
      : entryPrice * (1 + slRange.min / 100);
  } else if (slPercentage > slRange.max) {
    sl = direction === 'buy'
      ? entryPrice * (1 - slRange.max / 100)
      : entryPrice * (1 + slRange.max / 100);
  }
  
  // Validar R:R
  const risk = Math.abs(entryPrice - sl);
  const reward = Math.abs(tp - entryPrice);
  const riskReward = risk > 0 ? reward / risk : 0;
  
  // Ajustar TP se R:R insuficiente
  if (riskReward < minRiskReward) {
    tp = direction === 'buy'
      ? entryPrice + (risk * minRiskReward)
      : entryPrice - (risk * minRiskReward);
  }
  
  // Recalcular R:R final
  const finalReward = Math.abs(tp - entryPrice);
  const finalRR = risk > 0 ? finalReward / risk : 0;
  
  return {
    sl,
    tp,
    entryPrice,
    risk,
    reward: finalReward,
    riskReward: Math.round(finalRR * 100) / 100,
    slPercentage: Math.round((risk / entryPrice) * 10000) / 100,
    tpPercentage: Math.round((finalReward / entryPrice) * 10000) / 100,
    adxRegime,
    method: legSize > 0 ? 'fibonacci' : 'atr',
    isValid: finalRR >= minRiskReward
  };
};

/**
 * Calcula níveis de Fibonacci adaptativos
 */
export const calculateAdaptiveFibonacci = (entryPrice, swingHigh, swingLow, adx, direction, config) => {
  const { levelsByADX } = config.fibonacci;
  
  // Determinar níveis por ADX
  let levels;
  if (adx > 40) {
    levels = levelsByADX.strong;
  } else if (adx >= 30) {
    levels = levelsByADX.moderate;
  } else {
    levels = levelsByADX.weak;
  }
  
  const legSize = swingHigh - swingLow;
  
  let tp, sl;
  
  if (direction === 'buy') {
    // Para compra: TP acima da entrada, SL abaixo
    tp = entryPrice + (legSize * levels.tp);
    sl = entryPrice - (legSize * levels.sl);
  } else {
    // Para venda: TP abaixo da entrada, SL acima
    tp = entryPrice - (legSize * levels.tp);
    sl = entryPrice + (legSize * levels.sl);
  }
  
  // Validações
  const isValid = direction === 'buy'
    ? (tp > entryPrice && sl < entryPrice)
    : (tp < entryPrice && sl > entryPrice);
  
  return {
    tp,
    sl,
    fibLevels: levels,
    legSize,
    isValid,
    method: 'adaptiveFibonacci'
  };
};

/**
 * Calcula break-even dinâmico
 */
export const calculateDynamicBreakEven = (
  operation,
  currentPrice,
  previousCandle,
  obvAcceleration,
  config
) => {
  const { breakEven } = config.risk;
  const { entryPrice, takeProfit, stopLoss, type } = operation;
  
  // Calcular progresso até TP
  const totalDistance = Math.abs(takeProfit - entryPrice);
  const currentDistance = Math.abs(currentPrice - entryPrice);
  const progressPercent = (currentDistance / totalDistance) * 100;
  
  let newSL = stopLoss;
  let newTP = takeProfit;
  let breakEvenActivated = false;
  let tpExtended = false;
  
  // Verificar se está progredindo na direção correta
  const isProgressing = type === 'COMPRA'
    ? currentPrice > entryPrice
    : currentPrice < entryPrice;
  
  if (!isProgressing) {
    return {
      newSL,
      newTP,
      breakEvenActivated,
      tpExtended,
      progressPercent: 0
    };
  }
  
  // Ativar break-even ao atingir threshold
  if (progressPercent >= breakEven.activateAt * 100) {
    breakEvenActivated = true;
    
    // Mover SL para nível definido na config
    if (breakEven.moveToLevel === 'previousCandleLow') {
      newSL = type === 'COMPRA' ? previousCandle.low : previousCandle.high;
    } else if (breakEven.moveToLevel === 'entry') {
      newSL = entryPrice;
    }
    
    // Garantir que novo SL é melhor que o anterior
    if (type === 'COMPRA' && newSL < stopLoss) {
      newSL = stopLoss;
      breakEvenActivated = false;
    } else if (type === 'VENDA' && newSL > stopLoss) {
      newSL = stopLoss;
      breakEvenActivated = false;
    }
  }
  
  // Extensão de TP se OBV acelerando (> 20%)
  if (obvAcceleration > 20) {
    tpExtended = true;
    const extension = totalDistance * 0.2;
    
    newTP = type === 'COMPRA'
      ? takeProfit + extension
      : takeProfit - extension;
  }
  
  return {
    newSL,
    newTP,
    breakEvenActivated,
    tpExtended,
    progressPercent: Math.round(progressPercent * 10) / 10
  };
};

/**
 * Calcula position sizing baseado em risco
 */
export const calculatePositionSize = (
  capital,
  entryPrice,
  stopLoss,
  maxRiskPercent,
  leverage = 1
) => {
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  const maxRiskAmount = capital * maxRiskPercent;
  
  // Quantidade máxima baseada no risco
  const maxQuantity = maxRiskAmount / riskPerUnit;
  
  // Valor da posição
  const positionValue = maxQuantity * entryPrice;
  
  // Com alavancagem
  const requiredMargin = positionValue / leverage;
  
  return {
    quantity: maxQuantity,
    positionValue,
    requiredMargin,
    riskAmount: maxRiskAmount,
    riskPerUnit,
    leverage
  };
};

/**
 * Valida se reentrada é permitida
 */
export const validateReentry = (
  currentSignal,
  lastSignal,
  candlesSinceLast,
  pullbackPercent,
  volumeConfirm,
  scoreImproved,
  config
) => {
  const { reentry } = config;
  
  if (!reentry.enabled) {
    return { allowed: false, reason: 'Reentrada desabilitada' };
  }
  
  // Verificar cooldown
  if (candlesSinceLast < reentry.cooldownCandles) {
    return {
      allowed: false,
      reason: `Cooldown ativo (${candlesSinceLast}/${reentry.cooldownCandles} candles)`
    };
  }
  
  // Verificar pullback máximo
  if (pullbackPercent > reentry.maxPullback) {
    return {
      allowed: false,
      reason: `Pullback excessivo (${(pullbackPercent * 100).toFixed(1)}% > ${reentry.maxPullback * 100}%)`
    };
  }
  
  // Verificar volume sustentado
  if (reentry.requireSustainedVolume && !volumeConfirm) {
    return { allowed: false, reason: 'Volume não sustentado' };
  }
  
  // Verificar melhoria de score
  if (reentry.requireScoreImprovement && !scoreImproved) {
    return { allowed: false, reason: 'Score não melhorou' };
  }
  
  return {
    allowed: true,
    pullbackPercent,
    candlesSinceLast
  };
};

/**
 * Verifica se TP ou SL foi atingido
 */
export const checkTPSL = (operation, currentPrice) => {
  const { type, takeProfit, stopLoss, entryPrice } = operation;
  
  let hitTP = false;
  let hitSL = false;
  
  if (type === 'COMPRA') {
    hitTP = currentPrice >= takeProfit;
    hitSL = currentPrice <= stopLoss;
  } else {
    hitTP = currentPrice <= takeProfit;
    hitSL = currentPrice >= stopLoss;
  }
  
  if (hitTP) {
    const profit = type === 'COMPRA'
      ? ((takeProfit - entryPrice) / entryPrice) * 100
      : ((entryPrice - takeProfit) / entryPrice) * 100;
    
    return { hit: 'tp', profit: Math.round(profit * 100) / 100 };
  }
  
  if (hitSL) {
    const loss = type === 'COMPRA'
      ? ((stopLoss - entryPrice) / entryPrice) * 100
      : ((entryPrice - stopLoss) / entryPrice) * 100;
    
    return { hit: 'sl', profit: Math.round(loss * 100) / 100 };
  }
  
  // Calcular progresso atual
  const progress = type === 'COMPRA'
    ? ((currentPrice - entryPrice) / (takeProfit - entryPrice)) * 100
    : ((entryPrice - currentPrice) / (entryPrice - takeProfit)) * 100;
  
  return { hit: null, progress: Math.round(progress * 10) / 10 };
};

export default {
  calculateRiskLevels,
  calculateAdaptiveFibonacci,
  calculateDynamicBreakEven,
  calculatePositionSize,
  validateReentry,
  checkTPSL
};
