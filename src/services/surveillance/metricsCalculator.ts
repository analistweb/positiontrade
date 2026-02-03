// ========================================
// 🔍 MARKET SURVEILLANCE - Metrics Calculator
// ========================================

import {
  Trade,
  OrderBook,
  Kline,
  Ticker,
  VolumeMetrics,
  OrderBookMetrics,
  WashTradingMetrics,
  SpoofingMetrics,
  CorrelationMetrics,
  SurveillanceMetrics,
} from './types';

// ========================================
// VOLUME METRICS
// ========================================
export function calculateVolumeZScore(klines: Kline[]): VolumeMetrics {
  const defaultMetrics: VolumeMetrics = {
    zScore: 0,
    currentVolume: 0,
    averageVolume: 0,
    isAnomaly: false,
  };

  if (klines.length < 5) return defaultMetrics;

  const volumes = klines.map(k => k.volume).filter(v => !isNaN(v) && v > 0);
  if (volumes.length < 5) return defaultMetrics;

  const currentVolume = volumes[volumes.length - 1];
  const historicalVolumes = volumes.slice(0, -1);
  
  const mean = historicalVolumes.reduce((a, b) => a + b, 0) / historicalVolumes.length;
  const variance = historicalVolumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / historicalVolumes.length;
  const stdDev = Math.sqrt(variance);

  const zScore = stdDev > 0 ? (currentVolume - mean) / stdDev : 0;

  return {
    zScore: Math.min(Math.max(zScore, -10), 10), // Clamp to reasonable range
    currentVolume,
    averageVolume: mean,
    isAnomaly: Math.abs(zScore) > 2,
  };
}

// ========================================
// ORDER BOOK METRICS
// ========================================
export function calculateImbalanceRatio(orderBook: OrderBook): OrderBookMetrics {
  const defaultMetrics: OrderBookMetrics = {
    imbalanceRatio: 0,
    bidDepth: 0,
    askDepth: 0,
    spreadPercent: 0,
  };

  if (!orderBook.bids.length || !orderBook.asks.length) return defaultMetrics;

  // Calculate total depth
  const bidDepth = orderBook.bids.reduce((sum, level) => sum + (level.price * level.quantity), 0);
  const askDepth = orderBook.asks.reduce((sum, level) => sum + (level.price * level.quantity), 0);
  
  const totalDepth = bidDepth + askDepth;
  if (totalDepth === 0) return defaultMetrics;

  // Imbalance ratio: positive = more bids (bullish), negative = more asks (bearish)
  const imbalanceRatio = (bidDepth - askDepth) / totalDepth;

  // Calculate spread
  const bestBid = orderBook.bids[0]?.price || 0;
  const bestAsk = orderBook.asks[0]?.price || 0;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadPercent = midPrice > 0 ? ((bestAsk - bestBid) / midPrice) * 100 : 0;

  return {
    imbalanceRatio: Math.min(Math.max(imbalanceRatio, -1), 1),
    bidDepth,
    askDepth,
    spreadPercent,
  };
}

// ========================================
// WASH TRADING DETECTION
// ========================================
export function calculateWashTradingScore(trades: Trade[]): WashTradingMetrics {
  const defaultMetrics: WashTradingMetrics = {
    repeatPatternScore: 0,
    suspiciousTradeCount: 0,
    totalTradeCount: 0,
  };

  if (trades.length < 10) return defaultMetrics;

  let suspiciousCount = 0;
  const priceQtyMap = new Map<string, number>();

  // Look for repeated price+quantity patterns (wash trading signature)
  for (const trade of trades) {
    const key = `${trade.price.toFixed(4)}_${trade.quantity.toFixed(4)}`;
    const count = (priceQtyMap.get(key) || 0) + 1;
    priceQtyMap.set(key, count);
    
    if (count > 2) {
      suspiciousCount++;
    }
  }

  // Check for rapid alternating buy/sell
  for (let i = 1; i < trades.length - 1; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    const next = trades[i + 1];
    
    // Check if same price and alternating direction
    if (
      Math.abs(prev.price - curr.price) < 0.01 &&
      Math.abs(curr.price - next.price) < 0.01 &&
      prev.isBuyerMaker !== curr.isBuyerMaker &&
      curr.isBuyerMaker !== next.isBuyerMaker
    ) {
      suspiciousCount++;
    }
  }

  const repeatPatternScore = Math.min(suspiciousCount / trades.length, 1);

  return {
    repeatPatternScore,
    suspiciousTradeCount: suspiciousCount,
    totalTradeCount: trades.length,
  };
}

// ========================================
// SPOOFING DETECTION
// ========================================
export function calculatePhantomOrderScore(
  orderBook: OrderBook,
  previousOrderBook?: OrderBook | null
): SpoofingMetrics {
  const defaultMetrics: SpoofingMetrics = {
    phantomOrderScore: 0,
    largeOrdersCount: 0,
    canceledLargeOrders: 0,
  };

  if (!orderBook.bids.length || !orderBook.asks.length) return defaultMetrics;

  // Calculate average order size
  const allOrders = [...orderBook.bids, ...orderBook.asks];
  const avgSize = allOrders.reduce((sum, o) => sum + o.quantity, 0) / allOrders.length;
  
  // Count large orders (> 3x average)
  const largeOrdersCount = allOrders.filter(o => o.quantity > avgSize * 3).length;

  // If we have previous order book, detect phantom orders
  let canceledLargeOrders = 0;
  if (previousOrderBook) {
    const previousLargeOrders = [...previousOrderBook.bids, ...previousOrderBook.asks]
      .filter(o => o.quantity > avgSize * 3);
    
    // Check how many large orders disappeared
    for (const prevOrder of previousLargeOrders) {
      const stillExists = allOrders.some(
        o => Math.abs(o.price - prevOrder.price) < 0.01 && 
             Math.abs(o.quantity - prevOrder.quantity) < prevOrder.quantity * 0.1
      );
      if (!stillExists) {
        canceledLargeOrders++;
      }
    }
  }

  // Score based on large order churn
  const phantomOrderScore = largeOrdersCount > 0 
    ? Math.min(canceledLargeOrders / (largeOrdersCount + 1), 1)
    : 0;

  return {
    phantomOrderScore,
    largeOrdersCount,
    canceledLargeOrders,
  };
}

// ========================================
// PRICE-VOLUME CORRELATION
// ========================================
export function calculatePriceVolumeCorrelation(klines: Kline[]): CorrelationMetrics {
  const defaultMetrics: CorrelationMetrics = {
    correlation: 0,
    isNormalCorrelation: true,
  };

  if (klines.length < 10) return defaultMetrics;

  const priceChanges: number[] = [];
  const volumes: number[] = [];

  for (let i = 1; i < klines.length; i++) {
    const priceChange = (klines[i].close - klines[i - 1].close) / klines[i - 1].close;
    priceChanges.push(priceChange);
    volumes.push(klines[i].volume);
  }

  // Calculate Pearson correlation
  const n = priceChanges.length;
  const sumX = priceChanges.reduce((a, b) => a + b, 0);
  const sumY = volumes.reduce((a, b) => a + b, 0);
  const sumXY = priceChanges.reduce((sum, x, i) => sum + x * volumes[i], 0);
  const sumX2 = priceChanges.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = volumes.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  const correlation = denominator !== 0 ? numerator / denominator : 0;

  // Normal correlation is usually positive (price up = volume up)
  // Negative or very high correlation can indicate manipulation
  const isNormalCorrelation = correlation > -0.3 && correlation < 0.9;

  return {
    correlation: Math.min(Math.max(correlation, -1), 1),
    isNormalCorrelation,
  };
}

// ========================================
// MAIN CALCULATOR
// ========================================
export function calculateMetrics(
  trades: Trade[],
  orderBook: OrderBook | null,
  klines: Kline[],
  ticker: Ticker | null,
  previousOrderBook?: OrderBook | null
): SurveillanceMetrics {
  const safeOrderBook: OrderBook = orderBook || { bids: [], asks: [], lastUpdateId: 0 };
  
  return {
    volumeMetrics: calculateVolumeZScore(klines),
    orderBookMetrics: calculateImbalanceRatio(safeOrderBook),
    washTradingMetrics: calculateWashTradingScore(trades),
    spoofingMetrics: calculatePhantomOrderScore(safeOrderBook, previousOrderBook),
    correlationMetrics: calculatePriceVolumeCorrelation(klines),
    price: ticker?.price || (trades.length > 0 ? trades[trades.length - 1].price : 0),
    priceChange24h: ticker?.priceChangePercent || 0,
  };
}

export function getDefaultMetrics(): SurveillanceMetrics {
  return {
    volumeMetrics: {
      zScore: 0,
      currentVolume: 0,
      averageVolume: 0,
      isAnomaly: false,
    },
    orderBookMetrics: {
      imbalanceRatio: 0,
      bidDepth: 0,
      askDepth: 0,
      spreadPercent: 0,
    },
    washTradingMetrics: {
      repeatPatternScore: 0,
      suspiciousTradeCount: 0,
      totalTradeCount: 0,
    },
    spoofingMetrics: {
      phantomOrderScore: 0,
      largeOrdersCount: 0,
      canceledLargeOrders: 0,
    },
    correlationMetrics: {
      correlation: 0,
      isNormalCorrelation: true,
    },
    price: 0,
    priceChange24h: 0,
  };
}
