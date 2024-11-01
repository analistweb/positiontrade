import axios from 'axios';

const COINGLASS_API_KEY = 'YOUR_COINGLASS_API_KEY'; // Usuário precisa configurar
const FEAR_GREED_API = 'https://api.alternative.me/fng/';
const COINGLASS_API = 'https://open-api.coinglass.com/public/v2';
const CRYPTOPANIC_API_KEY = 'YOUR_CRYPTOPANIC_API_KEY'; // Usuário precisa configurar

export const fetchLiquidationData = async () => {
  try {
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
    throw error;
  }
};

export const fetchMarketSentiment = async () => {
  try {
    const response = await axios.get(FEAR_GREED_API);
    const socialResponse = await axios.get('https://api.alternative.me/v2/social_metrics/bitcoin');
    
    return {
      overallSentiment: parseInt(response.data.data[0].value),
      fearGreedIndex: parseInt(response.data.data[0].value),
      socialMediaMentions: [
        { platform: 'Twitter', sentiment: socialResponse.data.twitter.sentiment, volume: socialResponse.data.twitter.volume },
        { platform: 'Reddit', sentiment: socialResponse.data.reddit.sentiment, volume: socialResponse.data.reddit.volume },
        { platform: 'Telegram', sentiment: socialResponse.data.telegram.sentiment, volume: socialResponse.data.telegram.volume }
      ]
    };
  } catch (error) {
    console.error('Erro ao buscar dados de sentimento:', error);
    throw error;
  }
};

export const fetchMarketNews = async () => {
  try {
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
    throw error;
  }
};