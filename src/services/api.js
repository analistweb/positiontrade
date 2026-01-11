import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const FEAR_GREED_API = 'https://api.alternative.me/fng/';

// ✅ SEGURO: API keys agora são gerenciadas via Edge Functions no servidor
// Não há mais exposição de chaves no cliente

export const fetchLiquidationData = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-liquidation-data');
    
    if (error) {
      throw new Error(error.message || 'Erro ao buscar dados de liquidação');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar dados de liquidação:', error.message);
    throw new Error(`Falha ao obter dados de liquidação: ${error.message}`);
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
      socialMediaMentions: []
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados REAIS de sentimento:', error.message);
    throw new Error(`Falha ao obter Fear & Greed Index: ${error.message}`);
  }
};

// Nota: fetchMarketNews agora usa a Edge Function fetch-market-news via useMarketNews hook
// A função abaixo é mantida para compatibilidade, mas redireciona para a Edge Function
export const fetchMarketNews = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-news');
    
    if (error) {
      throw new Error(error.message || 'Erro ao buscar notícias');
    }
    
    return data?.news || [];
  } catch (error) {
    console.error('❌ Erro ao buscar notícias:', error.message);
    throw new Error(`Falha ao obter notícias: ${error.message}`);
  }
};
