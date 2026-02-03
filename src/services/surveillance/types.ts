// ========================================
// 🔍 MARKET SURVEILLANCE - Type Definitions
// ========================================

export type MarketStatus = 'HEALTHY' | 'ARTIFICIAL' | 'MANIPULATED';

export interface Trade {
  price: number;
  quantity: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface Ticker {
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
}

export interface VolumeMetrics {
  zScore: number;
  currentVolume: number;
  averageVolume: number;
  isAnomaly: boolean;
}

export interface OrderBookMetrics {
  imbalanceRatio: number;
  bidDepth: number;
  askDepth: number;
  spreadPercent: number;
}

export interface WashTradingMetrics {
  repeatPatternScore: number;
  suspiciousTradeCount: number;
  totalTradeCount: number;
}

export interface SpoofingMetrics {
  phantomOrderScore: number;
  largeOrdersCount: number;
  canceledLargeOrders: number;
}

export interface CorrelationMetrics {
  correlation: number;
  isNormalCorrelation: boolean;
}

export interface SurveillanceMetrics {
  volumeMetrics: VolumeMetrics;
  orderBookMetrics: OrderBookMetrics;
  washTradingMetrics: WashTradingMetrics;
  spoofingMetrics: SpoofingMetrics;
  correlationMetrics: CorrelationMetrics;
  price: number;
  priceChange24h: number;
}

export interface SurveillanceState {
  metrics: SurveillanceMetrics | null;
  status: MarketStatus;
  isConnected: boolean;
  lastUpdate: Date | null;
  selectedPair: string;
  error: string | null;
}

export type SurveillanceAction =
  | { type: 'UPDATE_METRICS'; payload: SurveillanceMetrics }
  | { type: 'SET_STATUS'; payload: MarketStatus }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAIR'; payload: string }
  | { type: 'RESET' };

export const SUPPORTED_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
] as const;

export type SupportedPair = typeof SUPPORTED_PAIRS[number];
