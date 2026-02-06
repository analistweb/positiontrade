// ========================================
// 💧 LIQUIDATION MAP - Type Definitions
// ========================================

// ========================================
// CORE TYPES
// ========================================

export interface LiquidationEvent {
  symbol: string;
  side: 'LONG' | 'SHORT';
  price: number;
  quantity: number;
  quoteValue: number;
  timestamp: number;
}

export interface LiquidationZone {
  priceMin: number;
  priceMax: number;
  priceMid: number;
  totalVolume: number;
  longVolume: number;
  shortVolume: number;
  dominantSide: 'LONG' | 'SHORT' | 'NEUTRAL';
  distancePercent: number;
  eventCount: number;
  relativeIntensity: number; // 0-1
}

export interface ProjectedLiquidationZone {
  priceMin: number;
  priceMax: number;
  priceMid: number;
  projectedSide: 'LONG' | 'SHORT';
  projectedIntensity: 'LOW' | 'MEDIUM' | 'HIGH';
  distancePercent: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  basedOnWindowMinutes: number;
}

// ========================================
// SYSTEM STATES
// ========================================

export type DataState = 'VALID' | 'INSUFFICIENT' | 'DEGRADED';

export type ProjectionState = 
  | 'HISTORICAL_ONLY'
  | 'HISTORICAL_PLUS_PROJECTION'
  | 'PROJECTION_BLOCKED_REGIME_CHANGE';

// ========================================
// MAP DATA STRUCTURE
// ========================================

export interface LiquidationMapData {
  symbol: string;
  currentPrice: number;
  historicalZones: LiquidationZone[];
  projectedZones: ProjectedLiquidationZone[];
  totalLongVolume: number;
  totalShortVolume: number;
  dataState: DataState;
  projectionState: ProjectionState;
  eventCount: number;
  windowMinutes: number;
}

// ========================================
// STREAM STATE
// ========================================

export interface LiquidationStreamState {
  isConnected: boolean;
  eventBuffer: LiquidationEvent[];
  mapData: LiquidationMapData | null;
  lastUpdate: Date | null;
  error: string | null;
}

// ========================================
// PROXIMITY ALERT
// ========================================

export interface ProximityAlert {
  type: 'HISTORICAL' | 'PROJECTED';
  zone: LiquidationZone | ProjectedLiquidationZone;
  distancePercent: number;
  isWithin: boolean;
  message: string;
}

// ========================================
// CONFIGURATION
// ========================================

export const LIQUIDATION_CONFIG = {
  MAX_BUFFER_SIZE: 2000,
  WINDOW_MINUTES: 60,
  MIN_ZONE_VOLUME_PERCENT: 5, // 5% of max volume
  PROXIMITY_THRESHOLD_PERCENT: 0.5,
  BUCKET_SIZE_PERCENT: 0.25, // Adaptive based on volatility
  MIN_EVENTS_FOR_VALID: 10,
  MIN_EVENTS_FOR_PROJECTION: 50,
  REGIME_STABILITY_WINDOWS: 3, // Number of sub-windows to check
} as const;

// ========================================
// ACTIONS FOR REDUCER
// ========================================

export type LiquidationAction =
  | { type: 'ADD_EVENT'; payload: LiquidationEvent }
  | { type: 'UPDATE_MAP'; payload: LiquidationMapData }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_PRICE'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_BUFFER' };
