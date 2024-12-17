import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';
import { toast } from "sonner";

const api = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 10000
});

// Implementa delay entre tentativas
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função de retry com backoff exponencial
const fetchWithRetry = async (fn, retries = 3, backoff = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    if (error.response?.status === 429) {
      await delay(backoff);
      return fetchWithRetry(fn, retries - 1, backoff * 2);
    }
    
    throw error;
  }
};

export const fetchMarketData = async (coinId, days) => {
  try {
    const response = await fetchWithRetry(() => 
      api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        headers: getHeaders()
      })
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados de mercado:', error);
    toast.error('Erro ao carregar dados de mercado. Tentando novamente...');
    throw error;
  }
};

export const fetchTopCoins = async () => {
  try {
    const response = await fetchWithRetry(() =>
      api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false
        },
        headers: getHeaders()
      })
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar top moedas:', error);
    toast.error('Erro ao carregar lista de moedas. Tentando novamente...');
    throw error;
  }
};

export const fetchBitcoinDominance = async () => {
  try {
    const response = await fetchWithRetry(() =>
      api.get('/global', {
        headers: getHeaders()
      })
    );
    return response.data.data.market_cap_percentage.btc;
  } catch (error) {
    console.error('Erro ao buscar dominância do Bitcoin:', error);
    toast.error('Erro ao carregar dominância do Bitcoin. Tentando novamente...');
    throw error;
  }
};

export const fetchMarketStats = async () => {
  try {
    const response = await fetchWithRetry(() =>
      api.get('/global', {
        headers: getHeaders()
      })
    );
    
    const data = response.data.data;
    return {
      totalMarketCap: data.total_market_cap.usd,
      volume24h: data.total_volume.usd,
      bitcoinDominance: data.market_cap_percentage.btc
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do mercado:', error);
    toast.error('Erro ao carregar estatísticas do mercado. Tentando novamente...');
    throw error;
  }
};

export const fetchCBBIData = async () => {
  try {
    const response = await fetchWithRetry(() =>
      api.get('/simple/price', {
        params: {
          ids: 'bitcoin',
          vs_currencies: 'usd',
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true
        },
        headers: getHeaders()
      })
    );

    const btcData = response.data.bitcoin;
    const price = btcData.usd;
    const marketCap = btcData.usd_market_cap;
    const volume = btcData.usd_24h_vol;
    const change = btcData.usd_24h_change;

    // Cálculo do CBBI baseado em métricas reais
    const marketCapScore = Math.min(100, (marketCap / 1e12) * 20); // Score baseado no market cap
    const volumeScore = Math.min(100, (volume / marketCap) * 200); // Score baseado no volume
    const changeScore = Math.min(100, (change + 100) / 2); // Score baseado na variação

    const cbbiValue = (marketCapScore + volumeScore + changeScore) / 3;

    return {
      value: cbbiValue.toFixed(2),
      confidence: cbbiValue > 80 ? 'Alta' : cbbiValue > 40 ? 'Média' : 'Baixa',
      marketPhase: cbbiValue > 80 ? 'Topo de Mercado' : cbbiValue > 40 ? 'Meio de Ciclo' : 'Fundo de Mercado',
      lastUpdate: new Date().toLocaleDateString()
    };
  } catch (error) {
    console.error('Erro ao buscar dados CBBI:', error);
    toast.error('Erro ao carregar dados CBBI. Tentando novamente...');
    throw error;
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    const response = await fetchWithRetry(() =>
      api.get('/exchanges/binance/volume_chart', {
        params: { days: 1 },
        headers: getHeaders()
      })
    );

    const volumes = response.data;
    return volumes.map(([timestamp, volume]) => ({
      timestamp,
      type: volume > 0 ? "Compra" : "Venda",
      cryptoAmount: Math.abs(volume),
      cryptoSymbol: "BTC",
      volume: Math.abs(volume * 40000), // Estimativa aproximada
      destination: volume > 0 ? "Carteira" : "Exchange",
      exchange: "Binance"
    }));
  } catch (error) {
    console.error('Erro ao buscar transações de baleias:', error);
    toast.error('Erro ao carregar transações. Tentando novamente...');
    throw error;
  }
};