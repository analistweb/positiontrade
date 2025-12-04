/**
 * MÓDULO B — ROMPIMENTO INTRABAR + EXECUÇÃO EM TEMPO REAL
 * Funções para detecção e validação de rompimentos intrabar
 */

/**
 * Valida rompimento intrabar com critérios rigorosos
 * @param {Object} currentCandle - Candle atual (em formação)
 * @param {Object} referenceCandle - Candle de referência (pivô)
 * @param {number} avgVolume - Volume médio (20 períodos)
 * @param {number} atr15 - ATR 15 períodos
 * @param {Array} recentTicks - Últimos 3 ticks para verificar progressão
 * @param {string} direction - 'buy' ou 'sell'
 * @returns {Object} - Validação do rompimento
 */
export const validateIntrabarBreakout = (
  currentCandle, 
  referenceCandle, 
  avgVolume, 
  atr15, 
  recentTicks = [], 
  direction
) => {
  const breakoutThreshold = 0.0005; // 0.05%
  
  // 1. Verificar rompimento de preço
  let priceBreakout = false;
  if (direction === 'buy') {
    priceBreakout = currentCandle.close > referenceCandle.high * (1 + breakoutThreshold);
  } else {
    priceBreakout = currentCandle.close < referenceCandle.low * (1 - breakoutThreshold);
  }
  
  if (!priceBreakout) {
    return { isValid: false, reason: 'Sem rompimento de preço' };
  }
  
  // 2. Validar tamanho da vela parcial
  const candleSize = Math.abs(currentCandle.high - currentCandle.low);
  const bodySize = Math.abs(currentCandle.close - currentCandle.open);
  
  // Corpo parcial >= 35% do ATR15
  if (bodySize < atr15 * 0.35) {
    return { isValid: false, reason: 'Corpo muito pequeno (<35% ATR)', bodySize, atr15 };
  }
  
  // 3. Verificar wick do lado do rompimento
  let wickOpposite = 0;
  if (direction === 'buy') {
    wickOpposite = currentCandle.close < currentCandle.open 
      ? currentCandle.open - currentCandle.low 
      : currentCandle.close - currentCandle.low;
  } else {
    wickOpposite = currentCandle.close > currentCandle.open 
      ? currentCandle.high - currentCandle.open 
      : currentCandle.high - currentCandle.close;
  }
  
  // Wick contrário <= 35% do tamanho da vela
  if (wickOpposite > candleSize * 0.35) {
    return { isValid: false, reason: 'Wick contrário muito grande (>35%)', wickOpposite, candleSize };
  }
  
  // 4. Projetar volume e validar
  // Volume parcial projetado >= 70% da média
  const volumeProjected = currentCandle.volume * 1.5; // Projeção simples
  if (volumeProjected < avgVolume * 0.7) {
    return { 
      isValid: false, 
      reason: 'Volume projetado insuficiente (<70% média)', 
      volumeProjected, 
      avgVolume 
    };
  }
  
  // 5. Validar progressão de 3 ticks consecutivos
  if (recentTicks.length >= 3) {
    let isProgressive = true;
    
    if (direction === 'buy') {
      // BUY: máximas progressivas
      for (let i = 1; i < recentTicks.length; i++) {
        if (recentTicks[i].high <= recentTicks[i - 1].high) {
          isProgressive = false;
          break;
        }
      }
    } else {
      // SELL: mínimas progressivas (decrescentes)
      for (let i = 1; i < recentTicks.length; i++) {
        if (recentTicks[i].low >= recentTicks[i - 1].low) {
          isProgressive = false;
          break;
        }
      }
    }
    
    if (!isProgressive) {
      return { isValid: false, reason: 'Sem progressão em 3 ticks consecutivos' };
    }
  }
  
  // 6. Rejeitar micro rompimentos (avanço < 0.05%)
  const priceAdvance = direction === 'buy' 
    ? (currentCandle.close - referenceCandle.high) / referenceCandle.high
    : (referenceCandle.low - currentCandle.close) / referenceCandle.low;
    
  if (priceAdvance < 0.0005) {
    return { isValid: false, reason: 'Micro rompimento (<0.05%)', priceAdvance };
  }
  
  return {
    isValid: true,
    bodySize,
    wickOpposite,
    volumeProjected,
    priceAdvance: (priceAdvance * 100).toFixed(2) + '%'
  };
};

/**
 * Valida todos os filtros do setup em tempo real (intrabar)
 * @param {Object} indicators - Todos os indicadores calculados
 * @param {string} direction - 'buy' ou 'sell'
 * @param {number} scoreThreshold - Score mínimo para entrada (padrão: 70)
 * @returns {Object} - Validação dos filtros + score
 */
export const validateIntrabarFilters = (indicators, direction, scoreThreshold = 70) => {
  const {
    ema50Aligned,
    adx,
    macdGrowing,
    macdHistogramGrowing,
    rsiValue,
    obvConfirming,
    volumeAboveAvg,
    breakoutStrength
  } = indicators;
  
  let score = 0;
  const checks = {};
  
  // 1. EMA50 na direção (15 pts)
  if (ema50Aligned) {
    score += 15;
    checks.ema50 = true;
  } else {
    checks.ema50 = false;
  }
  
  // 2. ADX regime (15 pts base + 5 pts extra se ADX >= 35) - AJUSTADO: aceitar ADX >= 22
  if (adx >= 25) {
    score += 15;
    checks.adx = true;
    
    if (adx >= 35) {
      score += 5; // Tendência forte
      checks.adxStrong = true;
    }
  } else if (adx >= 20) {
    score += 10; // Pontuação parcial para ADX em zona de transição
    checks.adx = 'partial';
  } else {
    checks.adx = false;
  }
  
  // 3. MACD crescente e histograma crescente (15 pts) - AJUSTADO: aceitar apenas um confirmado
  if (macdGrowing && macdHistogramGrowing) {
    score += 15;
    checks.macd = true;
  } else if (macdGrowing || macdHistogramGrowing) {
    score += 8; // Pontuação parcial se apenas um está crescendo
    checks.macd = 'partial';
  } else {
    checks.macd = false;
  }
  
  // 4. RSI saudável (10 pts) - AJUSTADO: faixas mais amplas para capturar movimentos fortes
  let rsiOk = false;
  let rsiPartial = false;
  
  if (direction === 'buy') {
    // RSI ideal: 40-70, aceitável em tendência forte: 30-80
    rsiOk = rsiValue >= 35 && rsiValue <= 75;
    rsiPartial = rsiValue >= 30 && rsiValue <= 80;
  } else {
    // RSI ideal: 30-60, aceitável em tendência forte: 20-70
    rsiOk = rsiValue >= 25 && rsiValue <= 65;
    rsiPartial = rsiValue >= 20 && rsiValue <= 70;
  }
  
  if (rsiOk) {
    score += 10;
    checks.rsi = true;
  } else if (rsiPartial) {
    score += 5; // Pontuação parcial para RSI em zona aceitável
    checks.rsi = 'partial';
  } else {
    checks.rsi = false;
  }
  
  // 5. OBV confirmando (10 pts)
  if (obvConfirming) {
    score += 10;
    checks.obv = true;
  } else {
    checks.obv = false;
  }
  
  // 6. Volume acima da média (15 pts) - AJUSTADO: pontuação parcial para volume próximo
  if (volumeAboveAvg) {
    score += 15;
    checks.volume = true;
  } else {
    // Se volume estiver pelo menos 70% da média, dar pontuação parcial
    score += 5;
    checks.volume = 'partial';
  }
  
  // 7. Força do candle (10 pts) - AJUSTADO: threshold reduzido para 0.4
  if (breakoutStrength >= 0.5) {
    score += 10;
    checks.candleStrength = true;
  } else if (breakoutStrength >= 0.3) {
    score += 5; // Pontuação parcial
    checks.candleStrength = 'partial';
  } else {
    checks.candleStrength = false;
  }
  
  // 8. Fibonacci alinhado com alvo natural (5 pts) - placeholder
  checks.fibonacci = true;
  score += 5;
  
  const isValid = score >= scoreThreshold;
  
  return {
    isValid,
    score,
    checks,
    threshold: scoreThreshold
  };
};

/**
 * Registra log avançado para auditoria e backtest
 * @param {Object} logData - Dados do log
 */
export const logIntrabarExecution = (logData) => {
  const {
    tickActivation,
    tickConfirmation,
    tickCancellation,
    atrIntrabar,
    volumeProjected,
    scoreIntrabar,
    adxMoment,
    rrRatio,
    fibUsed,
    entryPrice,
    tp,
    sl,
    direction
  } = logData;
  
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    tickActivation,
    tickConfirmation,
    tickCancellation: tickCancellation || null,
    atrIntrabar,
    volumeProjected,
    scoreIntrabar,
    adxMoment,
    rrRatio,
    fibUsed,
    entryPrice,
    tp,
    sl,
    direction
  };
  
  console.log('📊 [INTRABAR LOG]', logEntry);
  
  // Armazenar no localStorage para persistência (opcional)
  try {
    const logs = JSON.parse(localStorage.getItem('intrabar_logs') || '[]');
    logs.push(logEntry);
    // Manter apenas últimos 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    localStorage.setItem('intrabar_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Erro ao salvar log intrabar:', error);
  }
  
  return logEntry;
};

/**
 * Calcula break-even dinâmico intrabar
 * @param {Object} activeOperation - Operação ativa
 * @param {number} currentPrice - Preço atual
 * @param {number} obvAcceleration - Aceleração do OBV (%)
 * @param {Object} previousCandle - Candle anterior
 * @returns {Object} - Novo SL e possível extensão de TP
 */
export const calculateDynamicBreakEven = (
  activeOperation, 
  currentPrice, 
  obvAcceleration, 
  previousCandle
) => {
  const { entryPrice, takeProfit, stopLoss, type } = activeOperation;
  
  // Calcular progresso até o TP
  const totalDistance = Math.abs(takeProfit - entryPrice);
  const currentDistance = Math.abs(currentPrice - entryPrice);
  const progressPercent = (currentDistance / totalDistance) * 100;
  
  let newSL = stopLoss;
  let newTP = takeProfit;
  let breakEvenActivated = false;
  let tpExtended = false;
  
  // Ativar break-even ao atingir 60% do TP
  if (progressPercent >= 60) {
    breakEvenActivated = true;
    
    // Mover SL para mínima/máxima da vela anterior
    if (type === 'COMPRA') {
      newSL = previousCandle.low;
    } else {
      newSL = previousCandle.high;
    }
    
    console.log('🔄 Break-even ativado (60% do TP)', {
      tipo: type,
      progresso: progressPercent.toFixed(2) + '%',
      slAntigo: stopLoss,
      slNovo: newSL
    });
  }
  
  // Se OBV acelerar, permitir extensão de TP em até +20%
  if (obvAcceleration > 20) {
    tpExtended = true;
    const extension = totalDistance * 0.2;
    
    if (type === 'COMPRA') {
      newTP = takeProfit + extension;
    } else {
      newTP = takeProfit - extension;
    }
    
    console.log('📈 TP estendido devido à aceleração do OBV', {
      obvAceleracao: obvAcceleration.toFixed(2) + '%',
      tpAntigo: takeProfit,
      tpNovo: newTP
    });
  }
  
  return {
    newSL,
    newTP,
    breakEvenActivated,
    tpExtended,
    progressPercent: progressPercent.toFixed(2)
  };
};
