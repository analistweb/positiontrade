/**
 * Fetcher de dados históricos da Binance para backtest
 * Usa a API pública REST da Binance
 */

import type { Candle } from './asymmetricBacktest';

const BINANCE_API = 'https://api.binance.com/api/v3';

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

/**
 * Converte intervalo para milissegundos
 */
function intervalToMs(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60 * 1000,
    '3m': 3 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return map[interval] || 15 * 60 * 1000;
}

/**
 * Busca candles históricos da Binance
 * @param symbol - Par de trading (ex: ETHUSDT)
 * @param interval - Intervalo (ex: 15m)
 * @param startTime - Timestamp inicial
 * @param endTime - Timestamp final
 */
export async function fetchHistoricalCandles(
  symbol: string,
  interval: string = '15m',
  startTime?: number,
  endTime?: number
): Promise<Candle[]> {
  const allCandles: Candle[] = [];
  const limit = 1000; // Max por requisição
  const intervalMs = intervalToMs(interval);
  
  // Default: últimos 3 anos
  const now = Date.now();
  const threeYearsAgo = now - (3 * 365 * 24 * 60 * 60 * 1000);
  
  let currentStart = startTime || threeYearsAgo;
  const finalEnd = endTime || now;
  
  console.log(`[ASYMMETRIC] Buscando dados de ${symbol} ${interval}...`);
  console.log(`[ASYMMETRIC] Período: ${new Date(currentStart).toISOString()} até ${new Date(finalEnd).toISOString()}`);
  
  let requestCount = 0;
  const maxRequests = 120; // Limite de segurança (~3 anos em M15)
  
  while (currentStart < finalEnd && requestCount < maxRequests) {
    try {
      const url = new URL(`${BINANCE_API}/klines`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', interval);
      url.searchParams.set('startTime', currentStart.toString());
      url.searchParams.set('limit', limit.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }
      
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
      
      // Move para o próximo batch
      currentStart = data[data.length - 1][0] + intervalMs;
      requestCount++;
      
      // Rate limiting
      if (requestCount % 10 === 0) {
        console.log(`[ASYMMETRIC] Progresso: ${allCandles.length} candles carregados...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error('[ASYMMETRIC] Erro ao buscar dados:', error);
      throw error;
    }
  }
  
  console.log(`[ASYMMETRIC] Total: ${allCandles.length} candles carregados`);
  
  // Remove duplicados e ordena
  const unique = Array.from(
    new Map(allCandles.map(c => [c.timestamp, c])).values()
  ).sort((a, b) => a.timestamp - b.timestamp);
  
  return unique;
}

/**
 * Valida se temos dados suficientes para backtest
 * Mínimo: 3 anos OU 1000 trades
 */
export function validateDataSufficiency(
  candles: Candle[],
  interval: string = '15m'
): { valid: boolean; message: string; stats: { days: number; candles: number } } {
  if (candles.length === 0) {
    return { 
      valid: false, 
      message: 'Nenhum dado disponível',
      stats: { days: 0, candles: 0 }
    };
  }
  
  const firstTimestamp = candles[0].timestamp;
  const lastTimestamp = candles[candles.length - 1].timestamp;
  const durationMs = lastTimestamp - firstTimestamp;
  const durationDays = durationMs / (24 * 60 * 60 * 1000);
  
  // Mínimo 1 ano de dados
  const minDays = 365;
  
  if (durationDays < minDays) {
    return {
      valid: false,
      message: `Dados insuficientes: ${durationDays.toFixed(0)} dias (mínimo: ${minDays})`,
      stats: { days: durationDays, candles: candles.length }
    };
  }
  
  return {
    valid: true,
    message: `${durationDays.toFixed(0)} dias de dados (${candles.length} candles)`,
    stats: { days: durationDays, candles: candles.length }
  };
}
