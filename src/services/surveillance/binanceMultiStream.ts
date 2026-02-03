// ========================================
// 🔍 MARKET SURVEILLANCE - Binance WebSocket Manager
// ========================================

import { Trade, OrderBook, Kline, Ticker, OrderBookLevel } from './types';

type StreamType = 'trade' | 'depth' | 'kline' | 'ticker';

interface StreamConfig {
  type: StreamType;
  stream: string;
}

type TradeCallback = (trade: Trade) => void;
type DepthCallback = (orderBook: OrderBook) => void;
type KlineCallback = (kline: Kline) => void;
type TickerCallback = (ticker: Ticker) => void;

const BASE_URL = 'wss://stream.binance.com:9443/stream?streams=';

export class BinanceMultiStream {
  private ws: WebSocket | null = null;
  private symbol: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualDisconnect = false;
  
  // Callbacks
  private tradeCallbacks: TradeCallback[] = [];
  private depthCallbacks: DepthCallback[] = [];
  private klineCallbacks: KlineCallback[] = [];
  private tickerCallbacks: TickerCallback[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private errorCallbacks: ((error: string) => void)[] = [];
  
  // Buffers for calculations
  private tradeBuffer: Trade[] = [];
  private klineBuffer: Kline[] = [];
  private lastOrderBook: OrderBook | null = null;
  
  private readonly MAX_BUFFER_SIZE = 100;

  connect(symbol: string): void {
    this.symbol = symbol.toLowerCase();
    this.isManualDisconnect = false;
    
    // Build combined stream URL (max 5 streams per connection)
    const streams = [
      `${this.symbol}@trade`,
      `${this.symbol}@depth20@100ms`,
      `${this.symbol}@kline_1m`,
      `${this.symbol}@ticker`,
    ];
    
    const url = `${BASE_URL}${streams.join('/')}`;
    
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(`Failed to connect: ${error}`);
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.notifyConnection(true);
    };

    this.ws.onclose = () => {
      this.notifyConnection(false);
      if (!this.isManualDisconnect) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (event) => {
      this.handleError('WebSocket error occurred');
    };

    this.ws.onmessage = (event) => {
      try {
        const wrapper = JSON.parse(event.data);
        if (wrapper.data) {
          this.processMessage(wrapper.stream, wrapper.data);
        }
      } catch (error) {
        // Ignore parse errors for malformed messages
      }
    };
  }

  private processMessage(stream: string, data: unknown): void {
    if (!this.isValidData(data)) return;

    const streamType = this.getStreamType(stream);

    switch (streamType) {
      case 'trade':
        this.processTrade(data);
        break;
      case 'depth':
        this.processDepth(data);
        break;
      case 'kline':
        this.processKline(data);
        break;
      case 'ticker':
        this.processTicker(data);
        break;
    }
  }

  private getStreamType(stream: string): StreamType | null {
    if (stream.includes('@trade')) return 'trade';
    if (stream.includes('@depth')) return 'depth';
    if (stream.includes('@kline')) return 'kline';
    if (stream.includes('@ticker')) return 'ticker';
    return null;
  }

  private isValidData(data: unknown): data is Record<string, unknown> {
    return data !== null && typeof data === 'object';
  }

  private processTrade(data: Record<string, unknown>): void {
    const price = parseFloat(String(data.p || '0'));
    const quantity = parseFloat(String(data.q || '0'));
    const timestamp = Number(data.T || 0);
    const isBuyerMaker = Boolean(data.m);

    if (isNaN(price) || isNaN(quantity) || price <= 0) return;

    const trade: Trade = { price, quantity, timestamp, isBuyerMaker };
    
    this.tradeBuffer.push(trade);
    if (this.tradeBuffer.length > this.MAX_BUFFER_SIZE) {
      this.tradeBuffer.shift();
    }

    this.tradeCallbacks.forEach(cb => cb(trade));
  }

  private processDepth(data: Record<string, unknown>): void {
    const bids = this.parseOrderBookLevels(data.bids);
    const asks = this.parseOrderBookLevels(data.asks);
    
    if (bids.length === 0 && asks.length === 0) return;

    const orderBook: OrderBook = {
      bids,
      asks,
      lastUpdateId: Number(data.lastUpdateId || 0),
    };

    this.lastOrderBook = orderBook;
    this.depthCallbacks.forEach(cb => cb(orderBook));
  }

  private parseOrderBookLevels(levels: unknown): OrderBookLevel[] {
    if (!Array.isArray(levels)) return [];
    
    return levels
      .filter((level): level is [string, string] => 
        Array.isArray(level) && level.length >= 2
      )
      .map(([priceStr, qtyStr]) => ({
        price: parseFloat(priceStr),
        quantity: parseFloat(qtyStr),
      }))
      .filter(level => !isNaN(level.price) && !isNaN(level.quantity));
  }

  private processKline(data: Record<string, unknown>): void {
    const k = data.k as Record<string, unknown> | undefined;
    if (!k) return;

    const kline: Kline = {
      openTime: Number(k.t || 0),
      open: parseFloat(String(k.o || '0')),
      high: parseFloat(String(k.h || '0')),
      low: parseFloat(String(k.l || '0')),
      close: parseFloat(String(k.c || '0')),
      volume: parseFloat(String(k.v || '0')),
      closeTime: Number(k.T || 0),
    };

    if (isNaN(kline.close) || kline.close <= 0) return;

    // Replace or add kline based on openTime
    const existingIndex = this.klineBuffer.findIndex(
      k => k.openTime === kline.openTime
    );
    
    if (existingIndex >= 0) {
      this.klineBuffer[existingIndex] = kline;
    } else {
      this.klineBuffer.push(kline);
      if (this.klineBuffer.length > this.MAX_BUFFER_SIZE) {
        this.klineBuffer.shift();
      }
    }

    this.klineCallbacks.forEach(cb => cb(kline));
  }

  private processTicker(data: Record<string, unknown>): void {
    const ticker: Ticker = {
      price: parseFloat(String(data.c || '0')),
      priceChange: parseFloat(String(data.p || '0')),
      priceChangePercent: parseFloat(String(data.P || '0')),
      volume: parseFloat(String(data.v || '0')),
      quoteVolume: parseFloat(String(data.q || '0')),
    };

    if (isNaN(ticker.price) || ticker.price <= 0) return;

    this.tickerCallbacks.forEach(cb => cb(ticker));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect(this.symbol.toUpperCase());
      }
    }, delay);
  }

  private handleError(message: string): void {
    this.errorCallbacks.forEach(cb => cb(message));
  }

  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }

  // Public API
  onTrade(callback: TradeCallback): void {
    this.tradeCallbacks.push(callback);
  }

  onDepth(callback: DepthCallback): void {
    this.depthCallbacks.push(callback);
  }

  onKline(callback: KlineCallback): void {
    this.klineCallbacks.push(callback);
  }

  onTicker(callback: TickerCallback): void {
    this.tickerCallbacks.push(callback);
  }

  onConnection(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  onError(callback: (error: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  getTradeBuffer(): Trade[] {
    return [...this.tradeBuffer];
  }

  getKlineBuffer(): Kline[] {
    return [...this.klineBuffer];
  }

  getLastOrderBook(): OrderBook | null {
    return this.lastOrderBook;
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
    this.tradeCallbacks = [];
    this.depthCallbacks = [];
    this.klineCallbacks = [];
    this.tickerCallbacks = [];
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
  }

  clearBuffers(): void {
    this.tradeBuffer = [];
    this.klineBuffer = [];
    this.lastOrderBook = null;
  }
}

// Singleton instance for shared use
let instance: BinanceMultiStream | null = null;

export function getSurveillanceStream(): BinanceMultiStream {
  if (!instance) {
    instance = new BinanceMultiStream();
  }
  return instance;
}

export function resetSurveillanceStream(): void {
  if (instance) {
    instance.disconnect();
    instance.removeAllListeners();
    instance.clearBuffers();
    instance = null;
  }
}
