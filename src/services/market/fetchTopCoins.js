import { axiosInstance } from '../../config/api';
import { toast } from "sonner";
import { retryWithBackoff, handleAPIResponse, APIError } from '../errorHandlingService';
import { getTopCoinsCache, setTopCoinsCache } from '../cache/cacheService';
import { updateConnectionStatus } from '../../utils/connectionStatus';

// Dados de fallback para quando não conseguirmos obter dados reais
const fallbackTopCoins = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 30000 + Math.random() * 10000, price_change_percentage_24h: 2.5 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 2000 + Math.random() * 500, price_change_percentage_24h: 3.2 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1, price_change_percentage_24h: 0.01 },
  { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin', current_price: 300 + Math.random() * 50, price_change_percentage_24h: 1.5 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.5 + Math.random() * 0.2, price_change_percentage_24h: 4.1 }
];

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
