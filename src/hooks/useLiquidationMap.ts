// ========================================
// 💧 LIQUIDATION MAP - React Hook
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LiquidationEvent,
  LiquidationMapData,
  LiquidationStreamState,
  ProximityAlert,
  LIQUIDATION_CONFIG,
} from '@/services/liquidation/types';
import {
  BinanceFuturesStream,
  getLiquidationStream,
} from '@/services/liquidation/binanceFuturesStream';
import {
  LiquidationBuffer,
  calculateLiquidationMap,
  checkProximityAlerts,
} from '@/services/liquidation/liquidationEngine';

interface UseLiquidationMapOptions {
  symbol?: string;
  enabled?: boolean;
}

interface UseLiquidationMapReturn {
  state: LiquidationStreamState;
  mapData: LiquidationMapData | null;
  alerts: ProximityAlert[];
  eventCount: number;
  reconnect: () => void;
  setCurrentPrice: (price: number) => void;
}

export function useLiquidationMap(
  options: UseLiquidationMapOptions = {}
): UseLiquidationMapReturn {
  const { symbol, enabled = true } = options;

  const [state, setState] = useState<LiquidationStreamState>({
    isConnected: false,
    eventBuffer: [],
    mapData: null,
    lastUpdate: null,
    error: null,
  });

  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [alerts, setAlerts] = useState<ProximityAlert[]>([]);

  const streamRef = useRef<BinanceFuturesStream | null>(null);
  const bufferRef = useRef<LiquidationBuffer>(new LiquidationBuffer());
  const updateIntervalRef = useRef<number | null>(null);

  // Recalculate map data when buffer or price changes
  const recalculateMap = useCallback(() => {
    if (!symbol || currentPrice <= 0) return;

    const events = bufferRef.current.getEventsBySymbol(symbol);
    const mapData = calculateLiquidationMap(events, symbol, currentPrice);
    const newAlerts = checkProximityAlerts(mapData);

    setState(prev => ({
      ...prev,
      mapData,
      lastUpdate: new Date(),
    }));

    setAlerts(newAlerts);
  }, [symbol, currentPrice]);

  // Connect to stream
  const connect = useCallback(() => {
    if (!enabled) return;

    // Cleanup existing
    if (streamRef.current) {
      streamRef.current.disconnect();
      streamRef.current.removeAllListeners();
    }

    const stream = getLiquidationStream();
    streamRef.current = stream;

    // Set symbol filter
    stream.setSymbolFilter(symbol || null);

    // Handle connection
    stream.onConnection((connected) => {
      setState(prev => ({ ...prev, isConnected: connected, error: null }));
    });

    // Handle errors
    stream.onError((error) => {
      setState(prev => ({ ...prev, error }));
    });

    // Handle liquidation events
    stream.onLiquidation((event: LiquidationEvent) => {
      bufferRef.current.add(event);
      
      setState(prev => ({
        ...prev,
        eventBuffer: bufferRef.current.getEvents(),
      }));
    });

    // Connect
    stream.connect(symbol);

    // Periodic recalculation (every 3 seconds)
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = window.setInterval(() => {
      recalculateMap();
    }, 3000);
  }, [enabled, symbol, recalculateMap]);

  // Reconnect function
  const reconnect = useCallback(() => {
    bufferRef.current.clear();
    connect();
  }, [connect]);

  // Effect: Connect on mount and options change
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.disconnect();
        streamRef.current.removeAllListeners();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [enabled, symbol, connect]);

  // Effect: Recalculate when price changes
  useEffect(() => {
    if (currentPrice > 0) {
      recalculateMap();
    }
  }, [currentPrice, recalculateMap]);

  return {
    state,
    mapData: state.mapData,
    alerts,
    eventCount: bufferRef.current.size(),
    reconnect,
    setCurrentPrice,
  };
}
