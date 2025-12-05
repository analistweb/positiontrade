/**
 * MÓDULO DE LOGGING ESTRUTURADO (Browser Compatible)
 * Substitui console.* por logging centralizado com sampling e agregação
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SIGNAL: 4
};

// Configuração do logger
const config = {
  level: import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO,
  enableConsole: true,
  sampleRate: 1.0,
  maxBufferSize: 100,
  enableMetrics: true
};

// Buffer de logs para agregação
const logBuffer = [];
const metricsBuffer = {
  signals: { buy: 0, sell: 0, rejected: 0 },
  latency: [],
  errors: []
};

const getTimestamp = () => new Date().toISOString();

const redactSensitive = (data) => {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'email', 'phone'];
  const redacted = { ...data };
  for (const key of sensitiveKeys) {
    if (redacted[key]) redacted[key] = '[REDACTED]';
  }
  return redacted;
};

const shouldLog = () => Math.random() < config.sampleRate;

const createLogEntry = (level, module, message, data = {}) => ({
  timestamp: getTimestamp(),
  level: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level),
  module,
  message,
  data: redactSensitive(data),
  env: import.meta.env.DEV ? 'development' : 'production'
});

const log = (level, module, message, data = {}) => {
  if (level < config.level) return;
  if (!shouldLog() && level < LOG_LEVELS.WARN) return;
  
  const entry = createLogEntry(level, module, message, data);
  
  logBuffer.push(entry);
  if (logBuffer.length > config.maxBufferSize) logBuffer.shift();
  
  if (config.enableConsole) {
    const consoleMethod = level >= LOG_LEVELS.ERROR ? 'error' 
      : level >= LOG_LEVELS.WARN ? 'warn' 
      : level >= LOG_LEVELS.INFO ? 'info' 
      : 'log';
    
    const prefix = `[${entry.timestamp}] [${entry.level}] [${module}]`;
    console[consoleMethod](prefix, message, Object.keys(data).length ? data : '');
  }
  
  return entry;
};

const hashData = (data) => {
  try {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  } catch {
    return 'unknown';
  }
};

export const logger = {
  debug: (module, message, data) => log(LOG_LEVELS.DEBUG, module, message, data),
  info: (module, message, data) => log(LOG_LEVELS.INFO, module, message, data),
  warn: (module, message, data) => log(LOG_LEVELS.WARN, module, message, data),
  error: (module, message, data) => log(LOG_LEVELS.ERROR, module, message, data),
  
  signal: (type, data) => {
    const entry = log(LOG_LEVELS.SIGNAL, 'SignalEngine', `Sinal ${type} gerado`, data);
    if (config.enableMetrics) {
      if (type === 'COMPRA') metricsBuffer.signals.buy++;
      else if (type === 'VENDA') metricsBuffer.signals.sell++;
      else metricsBuffer.signals.rejected++;
    }
    return entry;
  },
  
  rejection: (reason, data) => {
    log(LOG_LEVELS.INFO, 'SignalEngine', `Sinal rejeitado: ${reason}`, data);
    if (config.enableMetrics) metricsBuffer.signals.rejected++;
  },
  
  latency: (operation, durationMs) => {
    if (config.enableMetrics) {
      metricsBuffer.latency.push({ operation, durationMs, timestamp: getTimestamp() });
      if (metricsBuffer.latency.length > 1000) metricsBuffer.latency.shift();
    }
    log(LOG_LEVELS.DEBUG, 'Performance', `${operation} completado`, { durationMs });
  },
  
  diagnostic: (signalId, data) => {
    const entry = {
      signalId,
      inputHash: hashData(data.inputs),
      configVersion: data.configVersion,
      timestamp: getTimestamp(),
      regime: data.regime,
      score: data.score,
      scoreBreakdown: data.scoreBreakdown,
      indicators: data.indicators,
      decision: data.decision,
      reason: data.reason
    };
    log(LOG_LEVELS.INFO, 'Diagnostic', `Diagnóstico do sinal ${signalId}`, entry);
    return entry;
  },
  
  getBuffer: () => [...logBuffer],
  getMetrics: () => ({ ...metricsBuffer }),
  clear: () => {
    logBuffer.length = 0;
    metricsBuffer.signals = { buy: 0, sell: 0, rejected: 0 };
    metricsBuffer.latency = [];
    metricsBuffer.errors = [];
  },
  configure: (newConfig) => Object.assign(config, newConfig)
};

// Backward compatibility exports
export const logError = (error, context = {}) => {
  logger.error('Legacy', error.message || error, { stack: error.stack, ...context });
};

export const logInfo = (message, context = {}) => {
  logger.info('Legacy', message, context);
};

export default logger;
