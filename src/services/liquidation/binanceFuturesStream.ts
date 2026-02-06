// ========================================
// 💧 LIQUIDATION MAP - Binance Futures WebSocket
// ========================================

import { LiquidationEvent } from './types';

const FUTURES_WS_URL = 'wss://fstream.binance.com/ws/!forceOrder@arr';

type LiquidationCallback = (event: LiquidationEvent) => void;
type ConnectionCallback = (connected: boolean) => void;
type ErrorCallback = (error: string) => void;

export class BinanceFuturesStream {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isManualDisconnect = false;
  
  // Callbacks
  private liquidationCallbacks: LiquidationCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  
  // Filter by symbol (optional)
  private symbolFilter: string | null = null;

  connect(symbol?: string): void {
    this.symbolFilter = symbol?.toUpperCase() || null;
    this.isManualDisconnect = false;
    
    try {
      this.ws = new WebSocket(FUTURES_WS_URL);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(`Failed to connect to Futures stream: ${error}`);
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[FuturesStream] Connected to Binance Futures');
      this.reconnectAttempts = 0;
      this.notifyConnection(true);
    };

    this.ws.onclose = () => {
      console.log('[FuturesStream] Disconnected');
      this.notifyConnection(false);
      if (!this.isManualDisconnect) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = () => {
      this.handleError('Futures WebSocket error occurred');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.processLiquidation(data);
      } catch (error) {
        // Ignore parse errors
      }
    };
  }

  private processLiquidation(data: Record<string, unknown>): void {
    // Binance forceOrder format:
    // { "e": "forceOrder", "E": timestamp, "o": { order details } }
    if (data.e !== 'forceOrder') return;
    
    const order = data.o as Record<string, unknown> | undefined;
    if (!order) return;

    const symbol = String(order.s || '');
    
    // Apply symbol filter if set
    if (this.symbolFilter && symbol !== this.symbolFilter) return;

    const side = String(order.S || '');
    const price = parseFloat(String(order.p || '0'));
    const quantity = parseFloat(String(order.q || '0'));
    const averagePrice = parseFloat(String(order.ap || price));
    const timestamp = Number(order.T || Date.now());

    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) return;

    // Determine liquidation side:
    // SELL order = LONG position was liquidated
    // BUY order = SHORT position was liquidated
    const liquidationSide: 'LONG' | 'SHORT' = side === 'SELL' ? 'LONG' : 'SHORT';

    const liquidationEvent: LiquidationEvent = {
      symbol,
      side: liquidationSide,
      price: averagePrice || price,
      quantity,
      quoteValue: quantity * (averagePrice || price),
      timestamp,
    };

    this.liquidationCallbacks.forEach(cb => cb(liquidationEvent));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError('Max reconnection attempts reached for Futures stream');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`[FuturesStream] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect(this.symbolFilter || undefined);
      }
    }, delay);
  }

  private handleError(message: string): void {
    console.error('[FuturesStream]', message);
    this.errorCallbacks.forEach(cb => cb(message));
  }

  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }

  // Public API
  onLiquidation(callback: LiquidationCallback): void {
    this.liquidationCallbacks.push(callback);
  }

  onConnection(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  removeAllListeners(): void {
    this.liquidationCallbacks = [];
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
  }

  setSymbolFilter(symbol: string | null): void {
    this.symbolFilter = symbol?.toUpperCase() || null;
  }
}

// Singleton instance
let instance: BinanceFuturesStream | null = null;

export function getLiquidationStream(): BinanceFuturesStream {
  if (!instance) {
    instance = new BinanceFuturesStream();
  }
  return instance;
}

export function resetLiquidationStream(): void {
  if (instance) {
    instance.disconnect();
    instance.removeAllListeners();
    instance = null;
  }
}
