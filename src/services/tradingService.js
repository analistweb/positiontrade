import axios from 'axios';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// Configuração de pares suportados
export const SUPPORTED_PAIRS = {
  BTCUSDT: {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    shortName: 'BTC',
    icon: '₿',
    color: 'hsl(38, 92%, 50%)',
    decimals: 2
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    shortName: 'ETH',
    icon: 'Ξ',
    color: 'hsl(230, 60%, 60%)',
    decimals: 2
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    name: 'Solana',
    shortName: 'SOL',
    icon: '◎',
    color: 'hsl(280, 70%, 60%)',
    decimals: 2
  },
  BNBUSDT: {
    symbol: 'BNBUSDT',
    name: 'BNB',
    shortName: 'BNB',
    icon: '⬡',
    color: 'hsl(45, 100%, 50%)',
    decimals: 2
  },
  XRPUSDT: {
    symbol: 'XRPUSDT',
    name: 'XRP',
    shortName: 'XRP',
    icon: '✕',
    color: 'hsl(210, 10%, 40%)',
    decimals: 4
  },
  DOGEUSDT: {
    symbol: 'DOGEUSDT',
    name: 'Dogecoin',
    shortName: 'DOGE',
    icon: 'Ð',
    color: 'hsl(40, 80%, 55%)',
    decimals: 5
  },
  ADAUSDT: {
    symbol: 'ADAUSDT',
    name: 'Cardano',
    shortName: 'ADA',
    icon: '₳',
    color: 'hsl(210, 80%, 50%)',
    decimals: 4
  },
  DOTUSDT: {
    symbol: 'DOTUSDT',
    name: 'Polkadot',
    shortName: 'DOT',
    icon: '●',
    color: 'hsl(330, 70%, 55%)',
    decimals: 3
  },
  PAXGUSDT: {
    symbol: 'PAXGUSDT',
    name: 'PAX Gold',
    shortName: 'PAXG',
    icon: '🥇',
    color: 'hsl(45, 90%, 50%)',
    decimals: 2
  },
  USDTBRL: {
    symbol: 'USDTBRL',
    name: 'Tether',
    shortName: 'USDT',
    icon: '₮',
    color: 'hsl(160, 60%, 45%)',
    decimals: 4
  }
};

/**
 * Busca dados de candlestick da Binance para qualquer par
 * @param {string} symbol - Par de trading (ex: 'BTCUSDT')
 * @param {string} interval - Intervalo (ex: '15m', '1h')
 * @param {number} limit - Quantidade de candles
 */
export const fetchKlineData = async (symbol, interval = '15m', limit = 100) => {
  try {
    const response = await axios.get(`${BINANCE_API_BASE}/klines`, {
      params: {
        symbol: symbol.toUpperCase(),
        interval,
        limit
      }
    });

    return response.data.map(candle => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  } catch (error) {
    console.error(`Erro ao buscar dados da Binance para ${symbol}:`, error);
    throw new Error(`Falha ao carregar dados de mercado ${symbol}`);
  }
};

/**
 * Busca preço atual de um par
 * @param {string} symbol - Par de trading
 */
export const fetchCurrentPrice = async (symbol) => {
  try {
    const response = await axios.get(`${BINANCE_API_BASE}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() }
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(`Erro ao buscar preço de ${symbol}:`, error);
    throw new Error(`Falha ao carregar preço ${symbol}`);
  }
};

/**
 * Busca dados de múltiplos pares simultaneamente
 * @param {string[]} symbols - Array de símbolos
 * @param {string} interval - Intervalo
 * @param {number} limit - Quantidade de candles
 */
export const fetchMultipleKlineData = async (symbols, interval = '15m', limit = 100) => {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchKlineData(symbol, interval, limit))
  );

  return symbols.reduce((acc, symbol, index) => {
    const result = results[index];
    acc[symbol] = result.status === 'fulfilled' 
      ? { data: result.value, error: null }
      : { data: null, error: result.reason.message };
    return acc;
  }, {});
};

/**
 * Busca estatísticas 24h de um par
 * @param {string} symbol - Par de trading
 */
export const fetch24hStats = async (symbol) => {
  try {
    const response = await axios.get(`${BINANCE_API_BASE}/ticker/24hr`, {
      params: { symbol: symbol.toUpperCase() }
    });
    
    return {
      priceChange: parseFloat(response.data.priceChange),
      priceChangePercent: parseFloat(response.data.priceChangePercent),
      highPrice: parseFloat(response.data.highPrice),
      lowPrice: parseFloat(response.data.lowPrice),
      volume: parseFloat(response.data.volume),
      quoteVolume: parseFloat(response.data.quoteVolume)
    };
  } catch (error) {
    console.error(`Erro ao buscar estatísticas de ${symbol}:`, error);
    throw new Error(`Falha ao carregar estatísticas ${symbol}`);
  }
};
