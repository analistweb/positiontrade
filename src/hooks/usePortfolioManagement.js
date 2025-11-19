import { useState, useEffect } from 'react';

const STORAGE_KEY = 'portfolio_holdings';

// Mock data inicial caso não tenha nada no localStorage
const INITIAL_PORTFOLIO = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 43250.00,
    quantity: 0.5,
    avg_buy_price: 40000.00,
    price_change_percentage_24h: 2.5
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 2280.00,
    quantity: 5,
    avg_buy_price: 2000.00,
    price_change_percentage_24h: 3.2
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    current_price: 0.52,
    quantity: 10000,
    avg_buy_price: 0.45,
    price_change_percentage_24h: -1.5
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 98.50,
    quantity: 25,
    avg_buy_price: 85.00,
    price_change_percentage_24h: 5.8
  }
];

export const usePortfolioManagement = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage ou usar dados iniciais
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPortfolio(JSON.parse(saved));
      } else {
        setPortfolio(INITIAL_PORTFOLIO);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PORTFOLIO));
      }
    } catch (error) {
      console.error('Erro ao carregar portfolio:', error);
      setPortfolio(INITIAL_PORTFOLIO);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar no localStorage sempre que o portfolio mudar
  useEffect(() => {
    if (portfolio.length > 0 && !isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
      } catch (error) {
        console.error('Erro ao salvar portfolio:', error);
      }
    }
  }, [portfolio, isLoading]);

  const updateHolding = (coinId, updates) => {
    setPortfolio(prev => 
      prev.map(coin => 
        coin.id === coinId 
          ? { ...coin, ...updates }
          : coin
      )
    );
  };

  const addHolding = (newCoin) => {
    setPortfolio(prev => [...prev, newCoin]);
  };

  const removeHolding = (coinId) => {
    setPortfolio(prev => prev.filter(coin => coin.id !== coinId));
  };

  const calculateStats = () => {
    if (portfolio.length === 0) {
      return {
        totalValue: 0,
        totalInvested: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
        bestPerformer: {},
        worstPerformer: {},
        change24h: 0
      };
    }

    let totalValue = 0;
    let totalInvested = 0;
    let weightedChange24h = 0;
    let bestPerformer = { profitPercent: -Infinity };
    let worstPerformer = { profitPercent: Infinity };

    portfolio.forEach(coin => {
      const currentValue = coin.quantity * coin.current_price;
      const investedValue = coin.quantity * (coin.avg_buy_price || coin.current_price);
      const profitLoss = currentValue - investedValue;
      const profitPercent = investedValue > 0 ? ((profitLoss / investedValue) * 100) : 0;

      totalValue += currentValue;
      totalInvested += investedValue;
      weightedChange24h += coin.price_change_percentage_24h * (currentValue / totalValue || 0);

      if (profitPercent > bestPerformer.profitPercent) {
        bestPerformer = {
          symbol: coin.symbol,
          profitPercent,
          profitValue: profitLoss
        };
      }

      if (profitPercent < worstPerformer.profitPercent) {
        worstPerformer = {
          symbol: coin.symbol,
          profitPercent,
          profitValue: profitLoss
        };
      }
    });

    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 
      ? ((totalProfitLoss / totalInvested) * 100) 
      : 0;

    return {
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercent,
      bestPerformer,
      worstPerformer,
      change24h: weightedChange24h
    };
  };

  return {
    portfolio,
    isLoading,
    updateHolding,
    addHolding,
    removeHolding,
    stats: calculateStats()
  };
};
