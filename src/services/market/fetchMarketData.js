
import { axiosInstance } from '../../config/api';
import { toast } from "sonner";
import { retryWithBackoff, handleAPIResponse, APIError } from '../errorHandlingService';
import { getMarketDataCache, setMarketDataCache } from '../cache/cacheService';
import { updateConnectionStatus } from '../../utils/connectionStatus';

// Dados de fallback para quando não conseguirmos obter dados reais
const fallbackMarketData = {
  prices: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 30000 + Math.random() * 10000]),
  market_caps: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 580000000000 + Math.random() * 20000000000]),
  total_volumes: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 20000000000 + Math.random() * 5000000000]),
  isFallbackData: true
};

let worker = null;

try {
  worker = new Worker('/marketAnalysis.worker.js');
} catch (error) {
  console.error('Error initializing Web Worker:', error);
}

const processDataWithWorker = async (data) => {
  if (!worker || !data || !data.prices || data.prices.length === 0) {
    return data;
  }
  
  // Aumente o timeout do worker para evitar problemas em dispositivos lentos
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.warn('Worker timeout, resolving with basic data');
      resolve(data);
    }, 10000); // 10 segundos

    worker.onmessage = function(e) {
      clearTimeout(timeoutId);
      const { type, data: workerData } = e.data;
      
      switch (type) {
        case 'RSI_RESULT':
          data.rsi = workerData;
          break;
        case 'PATTERNS_RESULT':
          data.patterns = workerData;
          break;
        case 'ERROR':
          console.error('Worker error:', workerData);
          break;
      }
      
      resolve(data);
    };

    worker.onerror = function(error) {
      clearTimeout(timeoutId);
      console.error('Worker error:', error);
      resolve(data); // Fallback to basic data
    };

    // Só envia a mensagem para o worker se tivermos dados
    try {
      worker.postMessage({
        type: 'calculateRSI',
        data: { prices: data.prices.map(p => p[1]) }
      });

      worker.postMessage({
        type: 'calculatePatterns',
        data: {
          prices: data.prices.map(p => p[1]),
          volumes: data.total_volumes.map(v => v[1])
        }
      });
    } catch (e) {
      console.error('Erro ao enviar mensagem para o worker:', e);
      resolve(data);
    }
  });
};

export const fetchMarketData = async (coin = 'bitcoin', days = 30) => {
  const cacheKey = `${coin}-${days}`;
  const cachedData = getMarketDataCache(cacheKey);
  
  if (cachedData) {
    console.log(`Usando dados em cache para ${coin}`);
    return cachedData;
  }

  try {
    console.log(`Buscando dados de mercado para ${coin} nos últimos ${days} dias`);
    
    // Implementa timeout mais curto para melhor experiência do usuário
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 segundos de timeout
    
    const response = await retryWithBackoff(
      async () => axiosInstance.get(`/coins/${coin}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        signal: controller.signal
      }),
      `buscar dados de mercado para ${coin}`
    );
    
    clearTimeout(timeoutId);
    
    // Verifica se a resposta é do cache
    const isFromCache = response.cached === true;
    
    const data = handleAPIResponse(response, 'market data');
    
    // Adiciona timestamp de última atualização
    data.lastUpdated = new Date().toLocaleTimeString();
    data.isFallbackData = false;
    data.isFromCache = isFromCache;

    const processedData = await processDataWithWorker(data);

    setMarketDataCache(cacheKey, processedData);
    return processedData;
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    // Só mostra toast de erro se não estiver usando dados em cache
    if (!error.cached) {
      toast.error(`Erro ao carregar dados: ${error.message || 'Falha de conexão'}`, {
        description: "Usando dados locais temporariamente"
      });
      
      // Atualiza o status da conexão
      updateConnectionStatus(false);
    }
    
    // Retornar dados de fallback em vez de falhar
    const fallbackData = {
      ...fallbackMarketData,
      lastUpdated: new Date().toLocaleTimeString(),
      coin: coin
    };
    
    setMarketDataCache(cacheKey, fallbackData);
    return fallbackData;
  }
};
