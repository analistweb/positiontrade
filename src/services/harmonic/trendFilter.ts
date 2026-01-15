/**
 * Filtro de tendência usando EMA200 no H4
 */

import type { Candle } from './types';

/**
 * Calcula EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  if (prices.length === 0) return ema;
  
  // Primeira EMA é a SMA
  let sum = 0;
  for (let i = 0; i < Math.min(period, prices.length); i++) {
    sum += prices[i];
  }
  ema[period - 1] = sum / Math.min(period, prices.length);
  
  // Calcula EMA para os demais
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
}

/**
 * Converte candles M15 para H4
 */
export function convertM15ToH4(candlesM15: Candle[]): Candle[] {
  const candlesH4: Candle[] = [];
  const candlesPerH4 = 16; // 4 horas / 15 minutos = 16
  
  for (let i = 0; i < candlesM15.length; i += candlesPerH4) {
    const batch = candlesM15.slice(i, i + candlesPerH4);
    if (batch.length === 0) continue;
    
    candlesH4.push({
      timestamp: batch[0].timestamp,
      open: batch[0].open,
      high: Math.max(...batch.map(c => c.high)),
      low: Math.min(...batch.map(c => c.low)),
      close: batch[batch.length - 1].close,
      volume: batch.reduce((sum, c) => sum + c.volume, 0)
    });
  }
  
  return candlesH4;
}

/**
 * Determina a tendência com base na EMA200 do H4
 */
export function trendFilter(
  candlesM15: Candle[],
  currentM15Index: number
): { trend: 'bullish' | 'bearish' | 'neutral'; ema200: number; price: number } {
  // Converte para H4
  const candlesH4 = convertM15ToH4(candlesM15.slice(0, currentM15Index + 1));
  
  if (candlesH4.length < 200) {
    return { trend: 'neutral', ema200: 0, price: 0 };
  }
  
  // Calcula EMA200 no H4
  const closePrices = candlesH4.map(c => c.close);
  const ema = calculateEMA(closePrices, 200);
  
  const currentEMA = ema[ema.length - 1];
  const currentPrice = candlesH4[candlesH4.length - 1].close;
  
  if (currentPrice > currentEMA * 1.001) {
    return { trend: 'bullish', ema200: currentEMA, price: currentPrice };
  } else if (currentPrice < currentEMA * 0.999) {
    return { trend: 'bearish', ema200: currentEMA, price: currentPrice };
  }
  
  return { trend: 'neutral', ema200: currentEMA, price: currentPrice };
}

/**
 * Busca dados H4 da Binance
 */
export async function fetchH4Candles(symbol: string, startTime: number, endTime: number): Promise<Candle[]> {
  const BINANCE_API = 'https://api.binance.com/api/v3';
  const allCandles: Candle[] = [];
  const limit = 1000;
  let currentStart = startTime;
  const intervalMs = 4 * 60 * 60 * 1000; // 4 horas
  
  while (currentStart < endTime) {
    try {
      const url = new URL(`${BINANCE_API}/klines`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', '4h');
      url.searchParams.set('startTime', currentStart.toString());
      url.searchParams.set('limit', limit.toString());
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) break;
      
      for (const kline of data) {
        allCandles.push({
          timestamp: kline[0],
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5])
        });
      }
      
      currentStart = data[data.length - 1][0] + intervalMs;
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error('[HARMONIC] Erro ao buscar H4:', error);
      break;
    }
  }
  
  return allCandles;
}

/**
 * Calcula EMA200 para array de candles H4 e retorna valores alinhados
 */
export function calculateEMA200ForH4(candlesH4: Candle[]): number[] {
  const closes = candlesH4.map(c => c.close);
  return calculateEMA(closes, 200);
}
