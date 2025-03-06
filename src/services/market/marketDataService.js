
import { axiosInstance } from '../../config/api';
import { toast } from "sonner";
import { retryWithBackoff, handleAPIResponse, APIError } from '../../services/errorHandlingService';
import { getMarketDataCache, setMarketDataCache, getTopCoinsCache, setTopCoinsCache } from '../cache/cacheService';
import { updateConnectionStatus } from '../../utils/connectionStatus';

let worker = null;

// Dados de fallback para quando não conseguirmos obter dados reais
const fallbackMarketData = {
  prices: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 30000 + Math.random() * 10000]),
  market_caps: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 580000000000 + Math.random() * 20000000000]),
  total_volumes: Array.from({ length: 90 }, (_, i) => [Date.now() - (89 - i) * 86400000, 20000000000 + Math.random() * 5000000000]),
  isFallbackData: true
};

const fallbackTopCoins = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 30000 + Math.random() * 10000, price_change_percentage_24h: 2.5 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 2000 + Math.random() * 500, price_change_percentage_24h: 3.2 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1, price_change_percentage_24h: 0.01 },
  { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin', current_price: 300 + Math.random() * 50, price_change_percentage_24h: 1.5 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.5 + Math.random() * 0.2, price_change_percentage_24h: 4.1 }
];

try {
  worker = new Worker('/marketAnalysis.worker.js');
} catch (error) {
  console.error('Error initializing Web Worker:', error);
}

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

    if (worker) {
      // Aumente o timeout do worker para evitar problemas em dispositivos lentos
      const processedData = await new Promise((resolve, reject) => {
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
        if (data && data.prices && data.prices.length > 0) {
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
        } else {
          resolve(data);
        }
      });

      setMarketDataCache(cacheKey, processedData);
      return processedData;
    }

    setMarketDataCache(cacheKey, data);
    return data;
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

export const fetchTopCoins = async () => {
  const cachedData = getTopCoinsCache();
  
  if (cachedData) {
    console.log('Usando dados em cache para top coins');
    return cachedData;
  }

  try {
    console.log('Buscando dados de principais moedas');
    
    // Implementa timeout mais curto para melhor experiência do usuário
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 segundos de timeout
    
    const response = await retryWithBackoff(
      async () => axiosInstance.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          sparkline: false,
          price_change_percentage: '24h'
        },
        signal: controller.signal
      }),
      'buscar top moedas'
    );
    
    clearTimeout(timeoutId);
    
    // Verifica se a resposta é do cache
    const isFromCache = response.cached === true;
    
    const data = handleAPIResponse(response, 'top coins');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new APIError("Dados de moedas não disponíveis", 400, 'INVALID_DATA');
    }
    
    // Adicionar indicação de dados reais
    const dataWithSource = data.map(coin => ({
      ...coin,
      isFallbackData: false,
      isFromCache: isFromCache,
      lastUpdated: new Date().toLocaleTimeString()
    }));
    
    setTopCoinsCache(dataWithSource);
    return dataWithSource;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    
    // Só mostra toast de erro se não estiver usando dados em cache
    if (!error.cached) {
      toast.error(`Erro ao carregar moedas: ${error.message || 'Falha de conexão'}`, {
        description: "Usando dados locais temporariamente"
      });
      
      // Atualiza o status da conexão
      updateConnectionStatus(false);
    }
    
    // Retornar dados de fallback em vez de falhar
    const dataWithTimestamp = fallbackTopCoins.map(coin => ({
      ...coin,
      isFallbackData: true,
      lastUpdated: new Date().toLocaleTimeString()
    }));
    
    setTopCoinsCache(dataWithTimestamp);
    return dataWithTimestamp;
  }
};
