// ========================================
// 💧 LIQUIDATION MAP - Processing Engine
// ========================================

import {
  LiquidationEvent,
  LiquidationZone,
  ProjectedLiquidationZone,
  LiquidationMapData,
  DataState,
  ProjectionState,
  LIQUIDATION_CONFIG,
} from './types';

// ========================================
// RING BUFFER FOR EVENTS
// ========================================

export class LiquidationBuffer {
  private events: LiquidationEvent[] = [];
  private maxSize: number;
  private windowMs: number;

  constructor(
    maxSize = LIQUIDATION_CONFIG.MAX_BUFFER_SIZE,
    windowMinutes = LIQUIDATION_CONFIG.WINDOW_MINUTES
  ) {
    this.maxSize = maxSize;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  add(event: LiquidationEvent): void {
    this.events.push(event);
    
    // FIFO: remove oldest if over max size
    if (this.events.length > this.maxSize) {
      this.events.shift();
    }
    
    // Remove events outside time window
    this.pruneOldEvents();
  }

  private pruneOldEvents(): void {
    const cutoff = Date.now() - this.windowMs;
    this.events = this.events.filter(e => e.timestamp > cutoff);
  }

  getEvents(): LiquidationEvent[] {
    this.pruneOldEvents();
    return [...this.events];
  }

  getEventsBySymbol(symbol: string): LiquidationEvent[] {
    return this.getEvents().filter(e => e.symbol === symbol);
  }

  clear(): void {
    this.events = [];
  }

  size(): number {
    return this.events.length;
  }
}

// ========================================
// ZONE CALCULATION ENGINE
// ========================================

interface PriceBucket {
  priceMin: number;
  priceMax: number;
  priceMid: number;
  longVolume: number;
  shortVolume: number;
  events: LiquidationEvent[];
}

function calculateVolatilityPercent(events: LiquidationEvent[]): number {
  if (events.length < 2) return 1; // Default 1%
  
  const prices = events.map(e => e.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  
  if (minPrice === 0) return 1;
  
  const range = ((maxPrice - minPrice) / minPrice) * 100;
  return Math.max(0.1, Math.min(range / 4, 2)); // Clamp between 0.1% and 2%
}

function createBuckets(
  events: LiquidationEvent[],
  currentPrice: number
): PriceBucket[] {
  if (events.length === 0) return [];

  const bucketSizePercent = calculateVolatilityPercent(events);
  const buckets: Map<number, PriceBucket> = new Map();

  for (const event of events) {
    // Calculate bucket index based on price distance from reference
    const distancePercent = ((event.price - currentPrice) / currentPrice) * 100;
    const bucketIndex = Math.floor(distancePercent / bucketSizePercent);
    
    const key = bucketIndex;
    
    if (!buckets.has(key)) {
      const priceMin = currentPrice * (1 + (bucketIndex * bucketSizePercent) / 100);
      const priceMax = currentPrice * (1 + ((bucketIndex + 1) * bucketSizePercent) / 100);
      buckets.set(key, {
        priceMin: Math.min(priceMin, priceMax),
        priceMax: Math.max(priceMin, priceMax),
        priceMid: (priceMin + priceMax) / 2,
        longVolume: 0,
        shortVolume: 0,
        events: [],
      });
    }

    const bucket = buckets.get(key)!;
    bucket.events.push(event);
    
    if (event.side === 'LONG') {
      bucket.longVolume += event.quoteValue;
    } else {
      bucket.shortVolume += event.quoteValue;
    }
  }

  return Array.from(buckets.values());
}

function bucketsToZones(
  buckets: PriceBucket[],
  currentPrice: number
): LiquidationZone[] {
  if (buckets.length === 0) return [];

  // Find max volume for relative intensity
  const maxVolume = Math.max(
    ...buckets.map(b => b.longVolume + b.shortVolume)
  );

  // Filter out insignificant buckets
  const significantBuckets = buckets.filter(b => {
    const totalVolume = b.longVolume + b.shortVolume;
    return (totalVolume / maxVolume) * 100 >= LIQUIDATION_CONFIG.MIN_ZONE_VOLUME_PERCENT;
  });

  // Convert to zones
  const zones: LiquidationZone[] = significantBuckets.map(bucket => {
    const totalVolume = bucket.longVolume + bucket.shortVolume;
    const distancePercent = ((bucket.priceMid - currentPrice) / currentPrice) * 100;
    
    let dominantSide: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    if (bucket.longVolume > bucket.shortVolume * 1.5) {
      dominantSide = 'LONG';
    } else if (bucket.shortVolume > bucket.longVolume * 1.5) {
      dominantSide = 'SHORT';
    }

    return {
      priceMin: bucket.priceMin,
      priceMax: bucket.priceMax,
      priceMid: bucket.priceMid,
      totalVolume,
      longVolume: bucket.longVolume,
      shortVolume: bucket.shortVolume,
      dominantSide,
      distancePercent,
      eventCount: bucket.events.length,
      relativeIntensity: maxVolume > 0 ? totalVolume / maxVolume : 0,
    };
  });

  // Sort by distance to current price
  return zones.sort((a, b) => 
    Math.abs(a.distancePercent) - Math.abs(b.distancePercent)
  );
}

// ========================================
// PROJECTION ENGINE
// ========================================

interface GradientMetrics {
  longGradient: number; // How LONG liquidations decay with distance
  shortGradient: number; // How SHORT liquidations decay with distance
  asymmetry: number; // -1 to 1, negative = more SHORT, positive = more LONG
  regimeStable: boolean;
}

function calculateGradientMetrics(
  events: LiquidationEvent[],
  currentPrice: number
): GradientMetrics {
  if (events.length < LIQUIDATION_CONFIG.MIN_EVENTS_FOR_PROJECTION) {
    return {
      longGradient: 0,
      shortGradient: 0,
      asymmetry: 0,
      regimeStable: false,
    };
  }

  const longEvents = events.filter(e => e.side === 'LONG');
  const shortEvents = events.filter(e => e.side === 'SHORT');

  // Calculate average distance for each side
  const calcAvgDistance = (evts: LiquidationEvent[]): number => {
    if (evts.length === 0) return 0;
    const distances = evts.map(e => 
      Math.abs((e.price - currentPrice) / currentPrice) * 100
    );
    return distances.reduce((a, b) => a + b, 0) / distances.length;
  };

  const longAvgDist = calcAvgDistance(longEvents);
  const shortAvgDist = calcAvgDistance(shortEvents);

  // Gradient: higher = liquidations happen closer to price
  const longGradient = longAvgDist > 0 ? 1 / longAvgDist : 0;
  const shortGradient = shortAvgDist > 0 ? 1 / shortAvgDist : 0;

  // Asymmetry calculation
  const totalLong = longEvents.reduce((sum, e) => sum + e.quoteValue, 0);
  const totalShort = shortEvents.reduce((sum, e) => sum + e.quoteValue, 0);
  const total = totalLong + totalShort;
  
  const asymmetry = total > 0 
    ? (totalLong - totalShort) / total 
    : 0;

  // Check regime stability (split into sub-windows)
  const windowCount = LIQUIDATION_CONFIG.REGIME_STABILITY_WINDOWS;
  const windowDuration = (LIQUIDATION_CONFIG.WINDOW_MINUTES * 60 * 1000) / windowCount;
  const now = Date.now();
  
  const subWindowAsymmetries: number[] = [];
  
  for (let i = 0; i < windowCount; i++) {
    const windowStart = now - (i + 1) * windowDuration;
    const windowEnd = now - i * windowDuration;
    
    const windowEvents = events.filter(
      e => e.timestamp >= windowStart && e.timestamp < windowEnd
    );
    
    if (windowEvents.length > 0) {
      const wLong = windowEvents
        .filter(e => e.side === 'LONG')
        .reduce((s, e) => s + e.quoteValue, 0);
      const wShort = windowEvents
        .filter(e => e.side === 'SHORT')
        .reduce((s, e) => s + e.quoteValue, 0);
      const wTotal = wLong + wShort;
      
      if (wTotal > 0) {
        subWindowAsymmetries.push((wLong - wShort) / wTotal);
      }
    }
  }

  // Regime is stable if all sub-windows have same sign
  const regimeStable = subWindowAsymmetries.length >= 2 &&
    subWindowAsymmetries.every(a => a >= 0) ||
    subWindowAsymmetries.every(a => a <= 0);

  return {
    longGradient,
    shortGradient,
    asymmetry,
    regimeStable,
  };
}

function generateProjectedZones(
  historicalZones: LiquidationZone[],
  metrics: GradientMetrics,
  currentPrice: number,
  windowMinutes: number
): ProjectedLiquidationZone[] {
  if (!metrics.regimeStable) return [];
  if (historicalZones.length === 0) return [];

  const projectedZones: ProjectedLiquidationZone[] = [];

  // Find the furthest historical zone for each side
  const longZones = historicalZones.filter(z => z.dominantSide === 'LONG');
  const shortZones = historicalZones.filter(z => z.dominantSide === 'SHORT');

  // Project beyond LONG zones (below current price typically)
  if (longZones.length > 0 && metrics.longGradient > 0) {
    const furthestLong = longZones.reduce((prev, curr) => 
      curr.distancePercent < prev.distancePercent ? curr : prev
    );
    
    // Project one zone further
    const projectedDistance = furthestLong.distancePercent * 1.5;
    const projectedMid = currentPrice * (1 + projectedDistance / 100);
    const zoneWidth = (furthestLong.priceMax - furthestLong.priceMin);

    projectedZones.push({
      priceMin: projectedMid - zoneWidth / 2,
      priceMax: projectedMid + zoneWidth / 2,
      priceMid: projectedMid,
      projectedSide: 'LONG',
      projectedIntensity: getIntensity(metrics.longGradient, furthestLong.relativeIntensity),
      distancePercent: projectedDistance,
      confidence: getConfidence(metrics.regimeStable, longZones.length),
      basedOnWindowMinutes: windowMinutes,
    });
  }

  // Project beyond SHORT zones (above current price typically)
  if (shortZones.length > 0 && metrics.shortGradient > 0) {
    const furthestShort = shortZones.reduce((prev, curr) => 
      curr.distancePercent > prev.distancePercent ? curr : prev
    );
    
    const projectedDistance = furthestShort.distancePercent * 1.5;
    const projectedMid = currentPrice * (1 + projectedDistance / 100);
    const zoneWidth = (furthestShort.priceMax - furthestShort.priceMin);

    projectedZones.push({
      priceMin: projectedMid - zoneWidth / 2,
      priceMax: projectedMid + zoneWidth / 2,
      priceMid: projectedMid,
      projectedSide: 'SHORT',
      projectedIntensity: getIntensity(metrics.shortGradient, furthestShort.relativeIntensity),
      distancePercent: projectedDistance,
      confidence: getConfidence(metrics.regimeStable, shortZones.length),
      basedOnWindowMinutes: windowMinutes,
    });
  }

  return projectedZones;
}

function getIntensity(
  gradient: number,
  parentIntensity: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
  const score = gradient * parentIntensity;
  if (score > 0.5) return 'HIGH';
  if (score > 0.2) return 'MEDIUM';
  return 'LOW';
}

function getConfidence(
  regimeStable: boolean,
  zoneCount: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!regimeStable) return 'LOW';
  if (zoneCount >= 5) return 'HIGH';
  if (zoneCount >= 3) return 'MEDIUM';
  return 'LOW';
}

// ========================================
// MAIN CALCULATION FUNCTION
// ========================================

export function calculateLiquidationMap(
  events: LiquidationEvent[],
  symbol: string,
  currentPrice: number
): LiquidationMapData {
  const windowMinutes = LIQUIDATION_CONFIG.WINDOW_MINUTES;
  
  // Determine data state
  let dataState: DataState = 'VALID';
  if (events.length === 0) {
    dataState = 'INSUFFICIENT';
  } else if (events.length < LIQUIDATION_CONFIG.MIN_EVENTS_FOR_VALID) {
    dataState = 'INSUFFICIENT';
  } else if (events.length < LIQUIDATION_CONFIG.MIN_EVENTS_FOR_PROJECTION / 2) {
    dataState = 'DEGRADED';
  }

  // Calculate totals
  const totalLongVolume = events
    .filter(e => e.side === 'LONG')
    .reduce((sum, e) => sum + e.quoteValue, 0);
  const totalShortVolume = events
    .filter(e => e.side === 'SHORT')
    .reduce((sum, e) => sum + e.quoteValue, 0);

  // If insufficient data, return early
  if (dataState === 'INSUFFICIENT') {
    return {
      symbol,
      currentPrice,
      historicalZones: [],
      projectedZones: [],
      totalLongVolume,
      totalShortVolume,
      dataState,
      projectionState: 'HISTORICAL_ONLY',
      eventCount: events.length,
      windowMinutes,
    };
  }

  // Create buckets and zones
  const buckets = createBuckets(events, currentPrice);
  const historicalZones = bucketsToZones(buckets, currentPrice);

  // Calculate gradient metrics for projection
  const gradientMetrics = calculateGradientMetrics(events, currentPrice);

  // Determine projection state
  let projectionState: ProjectionState = 'HISTORICAL_ONLY';
  let projectedZones: ProjectedLiquidationZone[] = [];

  if (events.length >= LIQUIDATION_CONFIG.MIN_EVENTS_FOR_PROJECTION) {
    if (gradientMetrics.regimeStable) {
      projectionState = 'HISTORICAL_PLUS_PROJECTION';
      projectedZones = generateProjectedZones(
        historicalZones,
        gradientMetrics,
        currentPrice,
        windowMinutes
      );
    } else {
      projectionState = 'PROJECTION_BLOCKED_REGIME_CHANGE';
    }
  }

  return {
    symbol,
    currentPrice,
    historicalZones,
    projectedZones,
    totalLongVolume,
    totalShortVolume,
    dataState,
    projectionState,
    eventCount: events.length,
    windowMinutes,
  };
}

// ========================================
// PROXIMITY CHECK
// ========================================

export function checkProximityAlerts(
  mapData: LiquidationMapData
): import('./types').ProximityAlert[] {
  const alerts: import('./types').ProximityAlert[] = [];
  const threshold = LIQUIDATION_CONFIG.PROXIMITY_THRESHOLD_PERCENT;
  const { currentPrice, historicalZones, projectedZones } = mapData;

  // Check historical zones
  for (const zone of historicalZones) {
    const isWithin = currentPrice >= zone.priceMin && currentPrice <= zone.priceMax;
    const distance = Math.min(
      Math.abs((currentPrice - zone.priceMin) / currentPrice * 100),
      Math.abs((currentPrice - zone.priceMax) / currentPrice * 100)
    );

    if (isWithin || distance < threshold) {
      alerts.push({
        type: 'HISTORICAL',
        zone,
        distancePercent: isWithin ? 0 : distance,
        isWithin,
        message: isWithin
          ? `Preço atual dentro de zona histórica de liquidação ${zone.dominantSide}`
          : `Preço a ${distance.toFixed(2)}% de zona histórica de liquidação ${zone.dominantSide}`,
      });
    }
  }

  // Check projected zones
  for (const zone of projectedZones) {
    const isWithin = currentPrice >= zone.priceMin && currentPrice <= zone.priceMax;
    const distance = Math.min(
      Math.abs((currentPrice - zone.priceMin) / currentPrice * 100),
      Math.abs((currentPrice - zone.priceMax) / currentPrice * 100)
    );

    if (isWithin || distance < threshold) {
      alerts.push({
        type: 'PROJECTED',
        zone,
        distancePercent: isWithin ? 0 : distance,
        isWithin,
        message: isWithin
          ? `Preço atual dentro de zona projetada (${zone.projectedSide}, confiança ${zone.confidence})`
          : `Preço a ${distance.toFixed(2)}% de zona projetada (${zone.projectedSide})`,
      });
    }
  }

  return alerts;
}
