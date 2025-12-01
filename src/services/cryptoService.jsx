
import { axiosInstance as axios, COINGECKO_API_URL, getHeaders } from '../config/api';
import { toast } from "sonner";

const handleServiceError = (error, context) => {
  console.error(`Erro em ${context}:`, error);
  const message = error.response?.data?.error || error.message || 'Erro desconhecido';
  toast.error(`${context}: ${message}`);
  throw new Error(message);
};

export const fetchPortfolioData = async () => {
  try {
    // Buscar top 10 criptomoedas com dados detalhados
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h,7d,30d', // Adicionando mais períodos de variação
        locale: 'pt'
      },
      headers: getHeaders()
    });

    if (!response.data) {
      throw new Error('Dados não disponíveis');
    }

    return response.data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
      price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      sparkline_in_7d: coin.sparkline_in_7d,
      quantity: coin.total_volume / coin.current_price, // Volume real de transações
      total_value: coin.total_volume // Valor total real
    }));
  } catch (error) {
    return handleServiceError(error, 'Buscar dados do portfólio');
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    // Calcular score baseado em dados reais
    const calculateSmartMoneyScore = (ticker) => {
      const volumeScore = Math.min(100, (ticker.volume / 1000000) * 10);
      const bidAskScore = Math.min(100, (Math.abs(ticker.bid - ticker.ask) / ticker.last) * 1000);
      return Math.floor((volumeScore + bidAskScore) / 2);
    };

    // Criar transações baseadas em dados reais de volume
    const createTransaction = (ticker, crypto) => ({
      timestamp: new Date(ticker.last_traded_at).toISOString(),
      type: ticker.last > ticker.bid ? "Compra" : "Venda",
      cryptoAmount: parseFloat((ticker.volume / ticker.last).toFixed(4)),
      cryptoSymbol: crypto,
      volume: ticker.volume,
      price: ticker.last,
      exchange: ticker.market?.name || 'Binance',
      smartMoneyScore: calculateSmartMoneyScore(ticker)
    });

    // Buscar dados de volume de exchanges para Bitcoin
    const [btcData, ethData] = await Promise.all([
      axios.get(`${COINGECKO_API_URL}/exchanges/binance/tickers/btc_usdt`, {
        headers: getHeaders(),
        timeout: 10000
      }).catch(() => null),
      axios.get(`${COINGECKO_API_URL}/exchanges/binance/tickers/eth_usdt`, {
        headers: getHeaders(),
        timeout: 10000
      }).catch(() => null)
    ]);

    // Verificar se conseguiu dados reais
    if (!btcData?.data?.tickers || !ethData?.data?.tickers) {
      throw new Error('Não foi possível obter dados reais de transações. Verifique a conexão com a API.');
    }

    // Combinar transações de BTC e ETH
    const whaleTransactions = [
      ...btcData.data.tickers.slice(0, 5).map(t => createTransaction(t, "BTC")),
      ...ethData.data.tickers.slice(0, 5).map(t => createTransaction(t, "ETH"))
    ].sort((a, b) => b.volume - a.volume);

    return whaleTransactions;
  } catch (error) {
    console.error('❌ Erro ao buscar transações REAIS:', error.message);
    throw new Error(`Falha ao obter dados reais de transações: ${error.message}`);
  }
};

// REMOVIDO: generateMockWhaleTransactions - apenas dados reais agora

export const fetchTopFormationData = async () => {
  try {
    // Buscar dados históricos mais detalhados
    const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 90, // Aumentado para 90 dias para melhor análise
        interval: 'daily'
      },
      headers: getHeaders()
    });

    if (!response.data) {
      throw new Error('Dados de formação de topo não disponíveis');
    }

    // Adicionar indicadores técnicos calculados
    const calculateMA = (prices, period) => {
      return prices.map((_, index) => {
        if (index < period - 1) return null;
        const slice = prices.slice(index - period + 1, index + 1);
        const average = slice.reduce((sum, price) => sum + price[1], 0) / period;
        return [prices[index][0], average];
      });
    };

    const prices = response.data.prices;
    const volumes = response.data.total_volumes;
    const ma20 = calculateMA(prices, 20);
    const ma50 = calculateMA(prices, 50);

    return {
      prices: response.data.prices,
      market_caps: response.data.market_caps,
      total_volumes: response.data.total_volumes,
      moving_averages: {
        ma20,
        ma50
      },
      volume_analysis: volumes.map((volume, index) => ({
        timestamp: volume[0],
        volume: volume[1],
        average_volume: index >= 7 
          ? volumes.slice(index - 7, index).reduce((sum, v) => sum + v[1], 0) / 7 
          : volume[1]
      }))
    };
  } catch (error) {
    return handleServiceError(error, 'Buscar dados de formação de topo');
  }
};
