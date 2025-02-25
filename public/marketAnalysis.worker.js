
// Web Worker para cálculos pesados de análise de mercado
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'calculateRSI':
      const rsi = calculateRSI(data.prices);
      self.postMessage({ type: 'RSI_RESULT', data: rsi });
      break;
      
    case 'calculatePatterns':
      const patterns = findPatterns(data.prices, data.volumes);
      self.postMessage({ type: 'PATTERNS_RESULT', data: patterns });
      break;
      
    default:
      self.postMessage({ type: 'ERROR', data: 'Invalid calculation type' });
  }
};

// Função otimizada para cálculo de RSI
function calculateRSI(prices) {
  if (!prices?.length) return null;
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains.push(difference);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(difference));
    }
  }
  
  const period = 14;
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  const rsiValues = [];
  
  // Primeiro RSI
  let rs = avgGain / (avgLoss || 1);
  let rsi = 100 - (100 / (1 + rs));
  rsiValues.push(rsi);
  
  // RSI para o restante do período
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    rs = avgGain / (avgLoss || 1);
    rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
  }
  
  return rsiValues;
}

// Função otimizada para encontrar padrões de mercado
function findPatterns(prices, volumes) {
  if (!prices?.length || !volumes?.length) return [];
  
  const patterns = [];
  const volumeThreshold = Math.max(...volumes) * 0.1; // 10% do volume máximo
  
  for (let i = 2; i < prices.length; i++) {
    // Verifica padrão de alta
    if (
      prices[i] > prices[i-1] && 
      prices[i-1] > prices[i-2] && 
      volumes[i] > volumeThreshold
    ) {
      patterns.push({
        type: 'BULLISH',
        index: i,
        confidence: calculateConfidence(prices[i], volumes[i], volumes)
      });
    }
    
    // Verifica padrão de baixa
    if (
      prices[i] < prices[i-1] && 
      prices[i-1] < prices[i-2] && 
      volumes[i] > volumeThreshold
    ) {
      patterns.push({
        type: 'BEARISH',
        index: i,
        confidence: calculateConfidence(prices[i], volumes[i], volumes)
      });
    }
  }
  
  return patterns;
}

// Função auxiliar para calcular confiança do padrão
function calculateConfidence(price, volume, allVolumes) {
  const avgVolume = allVolumes.reduce((a, b) => a + b, 0) / allVolumes.length;
  const volumeStrength = volume / avgVolume;
  
  return Math.min(Math.round(volumeStrength * 100), 100);
}
