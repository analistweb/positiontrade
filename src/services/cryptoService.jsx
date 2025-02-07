
import axios from '../config/api';
import { toast } from "sonner";
import { COINGECKO_API_URL, getHeaders } from '../config/api';

const handleServiceError = (error, context) => {
  console.error(`Erro em ${context}:`, error);
  const message = error.response?.data?.error || error.message || 'Erro desconhecido';
  toast.error(`${context}: ${message}`);
  throw new Error(message);
};

export const fetchPortfolioData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h',
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
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      sparkline_in_7d: coin.sparkline_in_7d
    }));
  } catch (error) {
    return handleServiceError(error, 'Buscar dados do portfólio');
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    // Simulating whale transactions based on large volume trades from CoinGecko
    const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/tickers`, {
      headers: getHeaders()
    });

    if (!response.data?.tickers) {
      throw new Error('Dados de transações não disponíveis');
    }

    // Filter and transform large volume trades into whale transactions
    const whaleTransactions = response.data.tickers
      .filter(ticker => ticker.volume > 1000000) // Filter transactions > $1M
      .slice(0, 10) // Get top 10 transactions
      .map(ticker => ({
        timestamp: new Date().toISOString(),
        type: Math.random() > 0.5 ? "Compra" : "Venda",
        cryptoAmount: (ticker.volume / ticker.last).toFixed(2),
        cryptoSymbol: "BTC",
        volume: ticker.volume,
        destination: Math.random() > 0.5 ? "Carteira" : "Exchange",
        exchange: ticker.market.name,
        destinationAddress: "0x" + Math.random().toString(16).slice(2, 42),
        smartMoneyScore: Math.floor(Math.random() * 40 + 60)
      }));

    return whaleTransactions;
  } catch (error) {
    return handleServiceError(error, 'Buscar transações de grandes players');
  }
};

export const fetchTopFormationData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      },
      headers: getHeaders()
    });

    if (!response.data) {
      throw new Error('Dados de formação de topo não disponíveis');
    }

    return {
      prices: response.data.prices,
      market_caps: response.data.market_caps,
      total_volumes: response.data.total_volumes
    };
  } catch (error) {
    return handleServiceError(error, 'Buscar dados de formação de topo');
  }
};
