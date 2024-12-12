import axios from 'axios';
import { toast } from "sonner";

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const fetchPortfolioData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h'
      }
    });

    return response.data;
  } catch (error) {
    toast.error("Erro ao carregar dados do portfólio: " + error.message);
    throw error;
  }
};

export const fetchWhaleTransactions = async () => {
  // Simulando dados mais detalhados de transações
  const mockTransactions = [
    {
      timestamp: Date.now(),
      type: "Compra",
      cryptoAmount: 150,
      cryptoSymbol: "BTC",
      volume: 6000000,
      destination: "Wallet",
      destinationAddress: "bc1q...3kf9",
      exchange: null
    },
    {
      timestamp: Date.now() - 1800000,
      type: "Venda",
      cryptoAmount: 2000,
      cryptoSymbol: "ETH",
      volume: 4000000,
      destination: "Exchange",
      destinationAddress: null,
      exchange: "Binance"
    },
    {
      timestamp: Date.now() - 3600000,
      type: "Compra",
      cryptoAmount: 1000000,
      cryptoSymbol: "XRP",
      volume: 500000,
      destination: "Wallet",
      destinationAddress: "rB5...9Uj",
      exchange: null
    }
  ];

  // Adicionando mais transações simuladas
  const types = ["Compra", "Venda"];
  const symbols = ["BTC", "ETH", "XRP", "SOL", "ADA"];
  const exchanges = ["Binance", "Coinbase", "Kraken", "FTX"];
  
  for (let i = 0; i < 7; i++) {
    const isWallet = Math.random() > 0.5;
    mockTransactions.push({
      timestamp: Date.now() - (i + 4) * 1800000,
      type: types[Math.floor(Math.random() * types.length)],
      cryptoAmount: Math.floor(Math.random() * 1000) + 1,
      cryptoSymbol: symbols[Math.floor(Math.random() * symbols.length)],
      volume: Math.floor(Math.random() * 5000000) + 500000,
      destination: isWallet ? "Wallet" : "Exchange",
      destinationAddress: isWallet ? `${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 6)}` : null,
      exchange: isWallet ? null : exchanges[Math.floor(Math.random() * exchanges.length)]
    });
  }

  return mockTransactions;
};