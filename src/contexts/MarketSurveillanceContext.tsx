import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  SurveillanceState,
  SurveillanceAction,
  SurveillanceMetrics,
  MarketStatus,
  OrderBook,
  Ticker,
} from '@/services/surveillance/types';
import { BinanceMultiStream } from '@/services/surveillance/binanceMultiStream';
import { calculateMetrics } from '@/services/surveillance/metricsCalculator';
import { calculateMarketStatus } from '@/services/surveillance/marketStatusEngine';

// ========================================
// INITIAL STATE
// ========================================
const initialState: SurveillanceState = {
  metrics: null,
  status: 'HEALTHY',
  isConnected: false,
  lastUpdate: null,
  selectedPair: 'BTCUSDT',
  error: null,
};

// ========================================
// REDUCER
// ========================================
function surveillanceReducer(
  state: SurveillanceState,
  action: SurveillanceAction
): SurveillanceState {
  switch (action.type) {
    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: action.payload,
        status: calculateMarketStatus(action.payload),
        lastUpdate: new Date(),
        error: null,
      };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PAIR':
      return { ...state, selectedPair: action.payload, metrics: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ========================================
// CONTEXT
// ========================================
interface SurveillanceContextValue {
  state: SurveillanceState;
  dispatch: React.Dispatch<SurveillanceAction>;
  changePair: (pair: string) => void;
  reconnect: () => void;
}

const MarketSurveillanceContext = createContext<SurveillanceContextValue | null>(null);

// ========================================
// PROVIDER
// ========================================
interface ProviderProps {
  children: ReactNode;
}

export function MarketSurveillanceProvider({ children }: ProviderProps) {
  const [state, dispatch] = useReducer(surveillanceReducer, initialState);
  const streamRef = useRef<BinanceMultiStream | null>(null);
  const previousOrderBookRef = useRef<OrderBook | null>(null);
  const tickerRef = useRef<Ticker | null>(null);
  const updateIntervalRef = useRef<number | null>(null);

  // Connect to WebSocket
  const connect = useCallback((pair: string) => {
    // Cleanup existing connection
    if (streamRef.current) {
      streamRef.current.disconnect();
      streamRef.current.removeAllListeners();
    }

    const stream = new BinanceMultiStream();
    streamRef.current = stream;

    // Connection status
    stream.onConnection((connected) => {
      dispatch({ type: 'SET_CONNECTED', payload: connected });
    });

    // Error handling
    stream.onError((error) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    });

    // Store ticker data
    stream.onTicker((ticker) => {
      tickerRef.current = ticker;
    });

    // Store order book for spoofing detection
    stream.onDepth((orderBook) => {
      previousOrderBookRef.current = stream.getLastOrderBook();
    });

    // Connect
    stream.connect(pair);

    // Periodic metrics calculation (every 2 seconds)
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = window.setInterval(() => {
      if (stream.isConnected()) {
        const trades = stream.getTradeBuffer();
        const klines = stream.getKlineBuffer();
        const orderBook = stream.getLastOrderBook();

        if (trades.length > 0 || klines.length > 0) {
          const metrics = calculateMetrics(
            trades,
            orderBook,
            klines,
            tickerRef.current,
            previousOrderBookRef.current
          );
          dispatch({ type: 'UPDATE_METRICS', payload: metrics });
        }
      }
    }, 2000);
  }, []);

  // Change trading pair
  const changePair = useCallback((pair: string) => {
    dispatch({ type: 'SET_PAIR', payload: pair });
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    connect(state.selectedPair);
  }, [connect, state.selectedPair]);

  // Effect: Connect on mount and pair change
  useEffect(() => {
    connect(state.selectedPair);

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.disconnect();
        streamRef.current.removeAllListeners();
        streamRef.current.clearBuffers();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [state.selectedPair, connect]);

  const value: SurveillanceContextValue = {
    state,
    dispatch,
    changePair,
    reconnect,
  };

  return (
    <MarketSurveillanceContext.Provider value={value}>
      {children}
    </MarketSurveillanceContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================
export function useMarketSurveillance() {
  const context = useContext(MarketSurveillanceContext);
  if (!context) {
    throw new Error(
      'useMarketSurveillance must be used within MarketSurveillanceProvider'
    );
  }
  return context;
}

export { MarketSurveillanceContext };
