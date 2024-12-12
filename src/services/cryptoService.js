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
    // Se a API_KEY estiver configurada, usa dados reais
    if (WHALE_ALERT_API_KEY) {
      const response = await axios.get(`${WHALE_ALERT_API_URL}/transactions`, {
        params: {
          api_key: WHALE_ALERT_API_KEY,
          min_value: 500000,
          start: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
          end: Math.floor(Date.now() / 1000),
        }
      });

      return response.data.transactions.map(tx => ({
        timestamp: tx.timestamp * 1000,
        type: tx.from.owner_type === "exchange" ? "Venda" : "Compra",
        cryptoAmount: tx.amount,
        cryptoSymbol: tx.symbol,
        volume: tx.amount_usd,
        destination: tx.to.owner_type === "exchange" ? "Exchange" : "Wallet",
        destinationAddress: tx.to.address,
        exchange: tx.to.owner_type === "exchange" ? tx.to.owner : null
      }));
    }
    
    // Dados simulados para demonstração
    const mockTransactions = [
      {
        timestamp: Date.now(),
        type: "Compra",
        cryptoAmount: 150,
        cryptoSymbol: "BTC",
        volume: 6000000,
        destination: "Wallet",
        destinationAddress: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5",
        exchange: null
      },
      {
        timestamp: Date.now() - 3600000,
        type: "Venda",
        cryptoAmount: 2800,
        cryptoSymbol: "ETH",
        volume: 5600000,
        destination: "Exchange",
        destinationAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        exchange: "Binance"
      },
      {
        timestamp: Date.now() - 7200000,
        type: "Compra",
        cryptoAmount: 1000000,
        cryptoSymbol: "XRP",
        volume: 520000,
        destination: "Wallet",
        destinationAddress: "rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh",
        exchange: null
      },
      {
        timestamp: Date.now() - 10800000,
        type: "Venda",
        cryptoAmount: 12500,
        cryptoSymbol: "SOL",
        volume: 875000,
        destination: "Exchange",
        destinationAddress: "2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdri9",
        exchange: "Kraken"
      },
      {
        timestamp: Date.now() - 14400000,
        type: "Compra",
        cryptoAmount: 45000,
        cryptoSymbol: "DOT",
        volume: 540000,
        destination: "Wallet",
        destinationAddress: "12xtAYsRUrmbniiWQqJtECiBQrMn8AypQcXhnQAc6RB6XkLW",
        exchange: null
      }
    ];

    return mockTransactions;
  } catch (error) {
    toast.error("Erro ao carregar transações: " + error.message);
    throw error;
  }
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