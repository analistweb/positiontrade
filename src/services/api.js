import axios from 'axios';

// ⚠️ AVISO DE SEGURANÇA ⚠️
// API Keys estão expostas no cliente (VITE_ prefix inclui no bundle).
// RECOMENDAÇÃO: Implementar Edge Functions com Lovable Cloud para ocultar chaves.
// RISCO ATUAL: Chaves podem ser extraídas por qualquer usuário via DevTools.
// Para produção: Mova estas chamadas para Edge Functions ou aceite uso limitado de APIs gratuitas.
const COINGLASS_API_KEY = import.meta.env.VITE_COINGLASS_API_KEY;
const CRYPTOPANIC_API_KEY = import.meta.env.VITE_CRYPTOPANIC_API_KEY;
const FEAR_GREED_API = 'https://api.alternative.me/fng/';
const COINGLASS_API = 'https://open-api.coinglass.com/public/v2';

// Mock data for development/testing
const mockLiquidationData = {
  liquidations: [
    {
      exchange: "Binance",
      amount: 1500000,
      type: "long",
      timestamp: Date.now()
    },
    {
      exchange: "Bybit",
      amount: 2000000,
      type: "short",
      timestamp: Date.now() - 300000
    }
  ],
  totalLiquidated: 3500000,
  longShortRate: 1.5
};

const mockSentimentData = {
  overallSentiment: 65,
  fearGreedIndex: 55,
  socialMediaMentions: [
    { platform: 'Twitter', sentiment: 70, volume: 1000 },
    { platform: 'Reddit', sentiment: 60, volume: 800 },
    { platform: 'Telegram', sentiment: 65, volume: 600 }
  ]
};

const mockNewsData = [
  {
    title: "Bitcoin atinge nova máxima do ano",
    source: { title: "CryptoNews" },
    url: "https://example.com/news/1",
    published_at: new Date().toISOString()
  },
  {
    title: "Mercado cripto mostra sinais de recuperação",
    source: { title: "CoinDesk" },
    url: "https://example.com/news/2",
    published_at: new Date().toISOString()
  }
];

export const fetchLiquidationData = async () => {
  try {
    if (!COINGLASS_API_KEY) {
      console.warn('COINGLASS_API_KEY não configurada, usando dados mock');
      return mockLiquidationData;
    }

    const response = await axios.get(`${COINGLASS_API}/liquidation_history`, {
      headers: { 'coinglassSecret': COINGLASS_API_KEY }
    });

    return {
      liquidations: response.data.data.slice(0, 10).map(liq => ({
        exchange: liq.exchangeName,
        amount: liq.amount,
        type: liq.side.toLowerCase(),
        timestamp: liq.updateTime
      })),
      totalLiquidated: response.data.data.reduce((sum, liq) => sum + liq.amount, 0),
      longVsShort: response.data.longShortRate
    };
  } catch (error) {
    console.error('Erro ao buscar dados de liquidação:', error);
    return mockLiquidationData;
  }
};

export const fetchMarketSentiment = async () => {
  try {
    const response = await axios.get(FEAR_GREED_API);
    return {
      overallSentiment: parseInt(response.data.data[0].value),
      fearGreedIndex: parseInt(response.data.data[0].value),
      socialMediaMentions: mockSentimentData.socialMediaMentions // Usando dados mock para métricas sociais
    };
  } catch (error) {
    console.error('Erro ao buscar dados de sentimento:', error);
    return mockSentimentData;
  }
};

export const fetchMarketNews = async () => {
  try {
    if (!CRYPTOPANIC_API_KEY) {
      console.warn('CRYPTOPANIC_API_KEY não configurada, usando dados mock');
      return mockNewsData;
    }

    const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: CRYPTOPANIC_API_KEY,
        kind: 'news',
        filter: 'hot'
      }
    });
    return response.data.results;
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return mockNewsData;
  }
};