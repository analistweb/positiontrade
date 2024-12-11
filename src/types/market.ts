export interface MarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

export interface BitcoinDominanceData {
  bitcoin_dominance: number;
  timestamp: number;
}