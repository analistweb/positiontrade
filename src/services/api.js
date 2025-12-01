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

// ⚠️ AVISO: Todas as funções agora usam APENAS dados reais de APIs
// Não há fallback para dados simulados - se a API falhar, o erro será propagado



export const fetchLiquidationData = async () => {
  if (!COINGLASS_API_KEY) {
    throw new Error('COINGLASS_API_KEY não configurada. Configure a chave de API para usar dados reais de liquidação.');
  }

  try {
    const response = await axios.get(`${COINGLASS_API}/liquidation_history`, {
      headers: { 'coinglassSecret': COINGLASS_API_KEY },
      timeout: 10000
    });

    if (!response.data || !response.data.data) {
      throw new Error('Resposta inválida da API Coinglass');
    }

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
    console.error('❌ Erro ao buscar dados REAIS de liquidação:', error.message);
    throw new Error(`Falha ao obter dados reais de liquidação: ${error.message}`);
  }
};

export const fetchMarketSentiment = async () => {
  try {
    const response = await axios.get(FEAR_GREED_API, { timeout: 10000 });
    
    if (!response.data || !response.data.data || !response.data.data[0]) {
      throw new Error('Resposta inválida da API Fear & Greed');
    }

    const fearGreedValue = parseInt(response.data.data[0].value);
    
    return {
      overallSentiment: fearGreedValue,
      fearGreedIndex: fearGreedValue,
      classification: response.data.data[0].value_classification,
      timestamp: response.data.data[0].timestamp,
      // Nota: métricas de redes sociais requerem API adicional (Twitter API, Reddit API, etc)
      // Por enquanto, retornando apenas Fear & Greed Index real
      socialMediaMentions: []
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados REAIS de sentimento:', error.message);
    throw new Error(`Falha ao obter Fear & Greed Index: ${error.message}`);
  }
};

export const fetchMarketNews = async () => {
  if (!CRYPTOPANIC_API_KEY) {
    throw new Error('CRYPTOPANIC_API_KEY não configurada. Configure a chave de API para usar notícias reais de cripto.');
  }

  try {
    const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: CRYPTOPANIC_API_KEY,
        kind: 'news',
        filter: 'hot',
        currencies: 'BTC,ETH'
      },
      timeout: 10000
    });

    if (!response.data || !response.data.results) {
      throw new Error('Resposta inválida da API CryptoPanic');
    }

    return response.data.results;
  } catch (error) {
    console.error('❌ Erro ao buscar notícias REAIS:', error.message);
    throw new Error(`Falha ao obter notícias reais: ${error.message}`);
  }
};