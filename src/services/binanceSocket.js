/**
 * Binance WebSocket Service
 * Fornece atualizações em tempo real de klines (candlesticks)
 */

import { z } from 'zod';

// Schema de validação para mensagens da Binance
const binanceKlineMessageSchema = z.object({
  e: z.literal('kline'),
  E: z.number().int().positive().optional(),
  s: z.string().optional(),
  k: z.object({
    t: z.number().int().positive(),
    T: z.number().int().positive().optional(),
    s: z.string().optional(),
    i: z.string().optional(),
    o: z.string().regex(/^\d+\.?\d*$/),
    c: z.string().regex(/^\d+\.?\d*$/),
    h: z.string().regex(/^\d+\.?\d*$/),
    l: z.string().regex(/^\d+\.?\d*$/),
    v: z.string().regex(/^\d+\.?\d*$/),
    n: z.number().int().nonnegative().optional(),
    x: z.boolean(),
    q: z.string().optional(),
    V: z.string().optional(),
    Q: z.string().optional()
  })
});

// Schema de validação para dados do candle processados
const candleDataSchema = z.object({
  timestamp: z.number().int().positive(),
  open: z.number().positive().finite(),
  high: z.number().positive().finite(),
  low: z.number().positive().finite(),
  close: z.number().positive().finite(),
  volume: z.number().nonnegative().finite(),
  isClosed: z.boolean()
}).refine(data => data.high >= data.low, {
  message: "High deve ser >= Low"
}).refine(data => {
  return data.high >= data.open && data.high >= data.close;
}, {
  message: "High deve ser maior ou igual a Open e Close"
}).refine(data => {
  return data.low <= data.open && data.low <= data.close;
}, {
  message: "Low deve ser menor ou igual a Open e Close"
});

export class BinanceKlineStream {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Set();
  }

  /**
   * Conecta ao stream de klines da Binance
   * @param {string} symbol - Par de trading (ex: 'ethusdt')
   * @param {string} interval - Intervalo (ex: '15m', '1h')
   */
  connect(symbol, interval) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
    
    console.log(`[BinanceWS] Conectando ao stream: ${symbol} ${interval}`);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[BinanceWS] ✅ Conexão estabelecida');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const rawMessage = JSON.parse(event.data);
        
        // Validar estrutura da mensagem com Zod
        const messageValidation = binanceKlineMessageSchema.safeParse(rawMessage);
        
        if (!messageValidation.success) {
          if (import.meta.env.DEV) {
            console.error('[BinanceWS] Mensagem inválida:', messageValidation.error.issues);
          }
          return; // Ignorar mensagem inválida silenciosamente
        }
        
        const message = messageValidation.data;
        
        // Notificar listeners apenas quando o candle FECHA (x = true)
        if (message.k.x) {
          const kline = message.k;
          
          // Converter strings para números
          const candleData = {
            timestamp: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            isClosed: kline.x
          };
          
          // Validar candle completo com Zod
          const candleValidation = candleDataSchema.safeParse(candleData);
          
          if (candleValidation.success) {
            this.notifyListeners(candleValidation.data);
          } else {
            if (import.meta.env.DEV) {
              console.error('[BinanceWS] Candle inválido:', candleValidation.error.issues);
            }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[BinanceWS] Erro ao processar mensagem:', error);
        }
        // Em produção, ignora silenciosamente para evitar exposição
      }
    };

    this.ws.onerror = (error) => {
      console.error('[BinanceWS] Erro na conexão:', error);
    };

    this.ws.onclose = () => {
      console.log('[BinanceWS] Conexão fechada');
      this.attemptReconnect(symbol, interval);
    };
  }

  /**
   * Tenta reconectar após desconexão
   */
  attemptReconnect(symbol, interval) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[BinanceWS] Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(symbol, interval);
      }, this.reconnectDelay);
    } else {
      console.error('[BinanceWS] ❌ Máximo de tentativas de reconexão atingido');
    }
  }

  /**
   * Adiciona um listener para novos candles
   * @param {Function} callback - Função chamada quando novo candle chega
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove um listener
   * @param {Function} callback
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notifica todos os listeners registrados
   * @param {Object} data - Dados do candle
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[BinanceWS] Erro no listener:', error);
      }
    });
  }

  /**
   * Desconecta o WebSocket
   */
  disconnect() {
    if (this.ws) {
      console.log('[BinanceWS] Desconectando...');
      this.ws.close();
      this.ws = null;
      this.listeners.clear();
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let streamInstance = null;

/**
 * Hook helper para uso em componentes React
 * @param {string} symbol
 * @param {string} interval
 * @param {Function} onKline - Callback quando novo candle chega
 */
export const useBinanceKlineStream = (symbol, interval, onKline) => {
  if (!streamInstance) {
    streamInstance = new BinanceKlineStream();
  }

  // Conectar e adicionar listener
  const connect = () => {
    streamInstance.connect(symbol, interval);
    if (onKline) {
      streamInstance.addListener(onKline);
    }
  };

  // Desconectar e remover listener
  const disconnect = () => {
    if (onKline) {
      streamInstance.removeListener(onKline);
    }
    // Não desconectar completamente, outros componentes podem estar usando
  };

  return { connect, disconnect, isConnected: streamInstance.isConnected() };
};

export default BinanceKlineStream;
