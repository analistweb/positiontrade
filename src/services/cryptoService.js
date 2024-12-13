import axios from 'axios';
import { toast } from "sonner";

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const WHALE_ALERT_API_URL = 'https://api.whale-alert.io/v1';
const WHALE_ALERT_API_KEY = import.meta.env.VITE_WHALE_ALERT_API_KEY;

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
      }
    });

    return response.data;
  } catch (error) {
    toast.error("Erro ao carregar dados do portfólio: " + error.message);
    throw error;
  }
};

export const fetchWhaleTransactions = async () => {
  try {
    if (!WHALE_ALERT_API_KEY) {
      toast.warning("Chave da API Whale Alert não configurada. Usando dados simulados.");
      return getMockWhaleTransactions();
    }

    const response = await axios.get(`${WHALE_ALERT_API_URL}/transactions`, {
      params: {
        api_key: WHALE_ALERT_API_KEY,
        min_value: 500000,  // Transações acima de $500,000
        blockchain: 'bitcoin,ethereum,tron', // Blockchains específicas
        start: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
        end: Math.floor(Date.now() / 1000),
      }
    });

    return processWhaleAlertTransactions(response.data.transactions);
  } catch (error) {
    toast.error("Erro ao buscar transações de baleias: " + error.message);
    return getMockWhaleTransactions();
  }
};

const processWhaleAlertTransactions = (transactions) => {
  return transactions.map(tx => ({
    timestamp: tx.timestamp * 1000,
    type: tx.from.owner_type === 'exchange' ? 'Venda' : 'Compra',
    cryptoAmount: tx.amount,
    cryptoSymbol: tx.symbol.toUpperCase(),
    volume: tx.amount_usd,
    destination: tx.to.owner_type === 'exchange' ? 'Exchange' : 'Carteira',
    destinationAddress: tx.to.address,
    exchange: tx.to.owner_type === 'exchange' ? tx.to.owner : null
  })).slice(0, 10);  // Limitar para 10 transações
};

const getMockWhaleTransactions = () => {
  return [
    {
      timestamp: Date.now(),
      type: "Compra",
      cryptoAmount: 150.75,
      cryptoSymbol: "BTC",
      volume: 6500000,
      destination: "Carteira",
      destinationAddress: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5",
      exchange: null
    },
    // ... outros dados simulados
  ];
};

export const fetchTopFormationData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'volume_desc',
        per_page: 20,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h,7d,30d',
        locale: 'pt'
      }
    });

    return response.data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      price_change_24h: coin.price_change_percentage_24h,
      price_change_7d: coin.price_change_percentage_7d,
      price_change_30d: coin.price_change_percentage_30d,
      sparkline: coin.sparkline_in_7d.price,
      ath: coin.ath,
      ath_date: coin.ath_date,
      atl: coin.atl,
      atl_date: coin.atl_date
    }));
  } catch (error) {
    toast.error("Erro ao carregar dados de formação de topo: " + error.message);
    throw error;
  }
};
