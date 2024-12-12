import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const fetchTopFormationData = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/bitcoin/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      }
    });

    return {
      prices: response.data.prices,
      total_volumes: response.data.total_volumes,
      market_caps: response.data.market_caps
    };
  } catch (error) {
    console.error('Error fetching top formation data:', error);
    throw new Error('Failed to fetch market data. Please try again later.');
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