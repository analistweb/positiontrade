/**
 * Fetcher de dados da Binance para estratégia harmônica
 */

import type { Candle } from './types';

const BINANCE_API = 'https://api.binance.com/api/v3';

/**
 * Busca candles M15 da Binance
 */
export async function fetchM15Candles(
  symbol: string,
  startTime?: number,
  endTime?: number,
  onProgress?: (loaded: number) => void
): Promise<Candle[]> {
  const allCandles: Candle[] = [];
  const limit = 1000;
  const intervalMs = 15 * 60 * 1000;
  
  const now = Date.now();
  const threeYearsAgo = now - (3 * 365 * 24 * 60 * 60 * 1000);
  
  let currentStart = startTime || threeYearsAgo;
  const finalEnd = endTime || now;
  
  console.log(`[HARMONIC] Buscando M15 de ${symbol}...`);
  
  let requestCount = 0;
  const maxRequests = 120;
  
  while (currentStart < finalEnd && requestCount < maxRequests) {
    try {
      const url = new URL(`${BINANCE_API}/klines`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', '15m');
      url.searchParams.set('startTime', currentStart.toString());
      url.searchParams.set('limit', limit.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
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
      requestCount++;
      
      if (onProgress) {
        onProgress(allCandles.length);
      }
      
      if (requestCount % 10 === 0) {
        console.log(`[HARMONIC] M15: ${allCandles.length} candles...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[HARMONIC] Erro M15:', error);
      throw error;
    }
  }
  
  // Remove duplicados
  const unique = Array.from(
    new Map(allCandles.map(c => [c.timestamp, c])).values()
  ).sort((a, b) => a.timestamp - b.timestamp);
  
  console.log(`[HARMONIC] M15 total: ${unique.length} candles`);
  return unique;
}

/**
 * Busca candles H4 da Binance
 */
export async function fetchH4Candles(
  symbol: string,
  startTime?: number,
  endTime?: number,
  onProgress?: (loaded: number) => void
): Promise<Candle[]> {
  const allCandles: Candle[] = [];
  const limit = 1000;
  const intervalMs = 4 * 60 * 60 * 1000;
  
  const now = Date.now();
  const threeYearsAgo = now - (3 * 365 * 24 * 60 * 60 * 1000);
  
  let currentStart = startTime || threeYearsAgo;
  const finalEnd = endTime || now;
  
  console.log(`[HARMONIC] Buscando H4 de ${symbol}...`);
  
  let requestCount = 0;
  const maxRequests = 30;
  
  while (currentStart < finalEnd && requestCount < maxRequests) {
    try {
      const url = new URL(`${BINANCE_API}/klines`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', '4h');
      url.searchParams.set('startTime', currentStart.toString());
      url.searchParams.set('limit', limit.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
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
      requestCount++;
      
      if (onProgress) {
        onProgress(allCandles.length);
      }
      
      if (requestCount % 5 === 0) {
        console.log(`[HARMONIC] H4: ${allCandles.length} candles...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[HARMONIC] Erro H4:', error);
      throw error;
    }
  }
  
  const unique = Array.from(
    new Map(allCandles.map(c => [c.timestamp, c])).values()
  ).sort((a, b) => a.timestamp - b.timestamp);
  
  console.log(`[HARMONIC] H4 total: ${unique.length} candles`);
  return unique;
}

/**
 * Valida se há dados suficientes
 */
export function validateDataSufficiency(
  candlesM15: Candle[],
  candlesH4: Candle[]
): { valid: boolean; message: string; daysM15: number; daysH4: number } {
  if (candlesM15.length === 0 || candlesH4.length === 0) {
    return { valid: false, message: 'Dados insuficientes', daysM15: 0, daysH4: 0 };
  }
  
  const m15Duration = (candlesM15[candlesM15.length - 1].timestamp - candlesM15[0].timestamp) / (24 * 60 * 60 * 1000);
  const h4Duration = (candlesH4[candlesH4.length - 1].timestamp - candlesH4[0].timestamp) / (24 * 60 * 60 * 1000);
  
  // Mínimo 1 ano para backtest válido
  const minDays = 365;
  
  if (m15Duration < minDays) {
    return {
      valid: false,
      message: `Dados M15 insuficientes: ${m15Duration.toFixed(0)} dias (mínimo: ${minDays})`,
      daysM15: m15Duration,
      daysH4: h4Duration
    };
  }
  
  return {
    valid: true,
    message: `M15: ${m15Duration.toFixed(0)} dias (${candlesM15.length} candles), H4: ${h4Duration.toFixed(0)} dias (${candlesH4.length} candles)`,
    daysM15: m15Duration,
    daysH4: h4Duration
  };
}
