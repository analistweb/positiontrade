
import { memoize } from 'lodash';

// Implementa memoização para cálculos frequentes
export const memoizedCalculateRSI = memoize((prices) => {
  if (!prices?.length) return null;
  
  // Otimização: Usa um único loop para calcular ganhos/perdas - O(n)
  const changes = new Float64Array(prices.length - 1);
  const gains = new Float64Array(prices.length - 1);
  const losses = new Float64Array(prices.length - 1);
  
  for (let i = 1; i < prices.length; i++) {
    changes[i-1] = prices[i] - prices[i-1];
    gains[i-1] = Math.max(0, changes[i-1]);
    losses[i-1] = Math.max(0, -changes[i-1]);
  }
  
  // Otimização: Usa Uint8Array para reduzir uso de memória
  const period = 14;
  const avgGain = new Float64Array(1);
  const avgLoss = new Float64Array(1);
  
  // Calcula médias iniciais - O(period)
  for (let i = 0; i < period; i++) {
    avgGain[0] += gains[i];
    avgLoss[0] += losses[i];
  }
  
  avgGain[0] /= period;
  avgLoss[0] /= period;
  
  // Calcula RSI final - O(1)
  const rs = avgGain[0] / (avgLoss[0] || 1);
  return 100 - (100 / (1 + rs));
}, (prices) => JSON.stringify(prices));

// Otimização para cálculo de médias móveis usando janela deslizante - O(n)
export const optimizedMovingAverage = (data, window) => {
  if (!data?.length || window > data.length) return [];
  
  const result = new Float64Array(data.length - window + 1);
  let sum = 0;
  
  // Calcula primeira janela
  for (let i = 0; i < window; i++) {
    sum += data[i];
  }
  result[0] = sum / window;
  
  // Usa técnica de janela deslizante para demais cálculos
  for (let i = window; i < data.length; i++) {
    sum = sum - data[i - window] + data[i];
    result[i - window + 1] = sum / window;
  }
  
  return Array.from(result);
};

// Cache LRU para armazenar resultados de cálculos frequentes
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) return null;
    
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }
}

export const calculationCache = new LRUCache(100);

// Otimização para detecção de padrões de mercado - O(n)
export const detectMarketPatterns = (prices, volumes) => {
  if (!prices?.length || !volumes?.length) return null;
  
  const patterns = new Set();
  const priceChanges = new Float64Array(prices.length - 1);
  const volumeChanges = new Float64Array(volumes.length - 1);
  
  // Calcula variações em um único loop
  for (let i = 1; i < prices.length; i++) {
    priceChanges[i-1] = ((prices[i] - prices[i-1]) / prices[i-1]) * 100;
    volumeChanges[i-1] = ((volumes[i] - volumes[i-1]) / volumes[i-1]) * 100;
  }
  
  // Detecta padrões usando thresholds otimizados
  const PRICE_THRESHOLD = 2.0;
  const VOLUME_THRESHOLD = 50.0;
  
  for (let i = 0; i < priceChanges.length; i++) {
    if (Math.abs(priceChanges[i]) > PRICE_THRESHOLD && 
        Math.abs(volumeChanges[i]) > VOLUME_THRESHOLD) {
      patterns.add({
        index: i + 1,
        priceChange: priceChanges[i],
        volumeChange: volumeChanges[i],
        pattern: priceChanges[i] > 0 ? 'bullish' : 'bearish'
      });
    }
  }
  
  return Array.from(patterns);
};
