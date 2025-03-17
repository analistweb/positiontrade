
import { axiosInstance } from '../config/api';
import axios from 'axios';
import { toast } from "sonner";
import { retryWithBackoff, handleAPIResponse } from '../services/errorHandlingService';
import { getWhaleTransactionsCache, setWhaleTransactionsCache } from '../cache/cacheService';

export const fetchWhaleTransactions = async (timeframe = '7d') => {
  const cachedData = getWhaleTransactionsCache(timeframe, 'exchange');
  
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log(`Fetching data for large movement analysis (${timeframe})`);
    
    const days = timeframe === '1d' ? 1 : 
                 timeframe === '7d' ? 7 :
                 timeframe === '14d' ? 14 : 30;
    
    // List of major exchanges for ticker data
    const exchanges = ['binance', 'coinbase', 'kraken', 'kucoin', 'bitfinex', 'huobi'];
    
    // Trading pairs to monitor
    const symbolPairs = [
      { symbol: 'BTC', pair: 'btc_usdt', id: 'bitcoin' },
      { symbol: 'ETH', pair: 'eth_usdt', id: 'ethereum' },
      { symbol: 'BNB', pair: 'bnb_usdt', id: 'binancecoin' },
      { symbol: 'XRP', pair: 'xrp_usdt', id: 'ripple' },
      { symbol: 'SOL', pair: 'sol_usdt', id: 'solana' }
    ];
    
    // Fetch historical volume data for reference
    const volumeDataPromises = symbolPairs.map(({ id, symbol }) => 
      axiosInstance.get(`/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: symbol === 'BTC' ? 'hourly' : 'daily'
        }
      }).catch(error => {
        console.error(`Error fetching volume data for ${symbol}:`, error);
        return null;
      })
    );
    
    // Fetch ticker data from exchanges for real-time transactions
    const tickerDataPromises = [];
    for (const exchange of exchanges) {
      // Limit to two exchanges per request to avoid overload
      const randomExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
      tickerDataPromises.push(
        axiosInstance.get(`/exchanges/${randomExchange}/tickers`, {
          params: { include_exchange_logo: false, depth: true }
        }).catch(error => {
          console.error(`Error fetching ticker data for ${randomExchange}:`, error);
          return null;
        })
      );
    }
    
    // Wait for all requests
    const responses = await Promise.all([
      ...volumeDataPromises,
      ...tickerDataPromises
    ]);
    
    // Filter null responses (errors)
    const validResponses = responses.filter(response => response && response.data);
    
    if (validResponses.length === 0) {
      throw new Error("Could not get real transaction data");
    }
    
    // Process volume data
    const volumeData = [];
    for (let i = 0; i < symbolPairs.length; i++) {
      if (responses[i] && responses[i].data) {
        volumeData.push({
          symbol: symbolPairs[i].symbol,
          id: symbolPairs[i].id,
          data: responses[i].data
        });
      }
    }
    
    // Process transactions
    const transactions = [];
    
    // Process exchange tickers
    for (let i = symbolPairs.length; i < responses.length; i++) {
      const response = responses[i];
      if (!response || !response.data || !response.data.tickers) continue;
      
      const tickers = response.data.tickers;
      
      // Filter by significant volume (top 10%)
      tickers.sort((a, b) => {
        const volumeA = a.converted_volume ? a.converted_volume.usd : 0;
        const volumeB = b.converted_volume ? b.converted_volume.usd : 0;
        return volumeB - volumeA;
      });
      
      const significantTickers = tickers.slice(0, Math.max(5, Math.ceil(tickers.length * 0.05)));
      
      for (const ticker of significantTickers) {
        // Check if it's a significant transaction (at least $50k)
        const volume = ticker.converted_volume?.usd || 0;
        if (volume < 50000) continue;
        
        const pair = ticker.base + '/' + ticker.target;
        const symbol = ticker.base;
        const price = ticker.last || 0;
        
        if (!price) continue;
        
        const amount = volume / price;
        const type = ticker.bid_ask_spread_percentage > 0.5 ? "Venda" : "Compra";
        
        // Calculate "smart money" score based on volume and spread
        let smartMoneyScore = Math.min(95, Math.max(70, Math.floor(80 + (volume / 1000000))));
        
        // If spread is low, more likely to be an experienced trader
        if (ticker.bid_ask_spread_percentage && ticker.bid_ask_spread_percentage < 0.2) {
          smartMoneyScore += 5;
        }
        
        transactions.push({
          timestamp: new Date().toISOString(),
          type,
          cryptoAmount: parseFloat(amount.toFixed(4)),
          cryptoSymbol: symbol,
          volume: parseFloat(volume.toFixed(2)),
          price: parseFloat(price.toFixed(2)),
          exchange: ticker.market?.name || exchange,
          destinationAddress: `${ticker.trade_url ? ticker.trade_url : ''}`,
          blockExplorer: ticker.trade_url,
          smartMoneyScore
        });
      }
    }
    
    // If not enough ticker data, use historical volume data
    if (transactions.length < 5 && volumeData.length > 0) {
      for (const { symbol, id, data } of volumeData) {
        if (!data.total_volumes || !data.prices) continue;
        
        const volumes = data.total_volumes;
        const prices = data.prices;
        
        if (volumes.length === 0 || prices.length === 0) continue;
        
        // Find significant volumes (top 10%)
        const significantVolumes = [...volumes].sort((a, b) => b[1] - a[1]).slice(0, Math.ceil(volumes.length * 0.1));
        
        for (const [timestamp, volume] of significantVolumes) {
          if (volume < 100000) continue; // Ignore small volumes
          
          // Find closest price to timestamp
          const closestPrice = prices.reduce((closest, current) => {
            return Math.abs(current[0] - timestamp) < Math.abs(closest[0] - timestamp) 
              ? current : closest;
          }, prices[0]);
          
          const price = closestPrice ? closestPrice[1] : 0;
          if (price === 0) continue;
          
          transactions.push({
            timestamp: new Date(timestamp).toISOString(),
            type: volume > 1000000 ? "Compra" : "Venda",
            cryptoAmount: parseFloat((volume / price).toFixed(4)),
            cryptoSymbol: symbol,
            volume: parseFloat((volume).toFixed(2)),
            price: parseFloat(price.toFixed(2)),
            exchange: "Global Market",
            destinationAddress: `https://www.coingecko.com/en/coins/${id}`,
            blockExplorer: `https://www.coingecko.com/en/coins/${id}`,
            smartMoneyScore: Math.min(95, Math.max(70, Math.floor(75 + (volume / 1000000))))
          });
        }
      }
    }
    
    if (transactions.length === 0) {
      throw new Error("No significant transactions found in the selected period");
    }
    
    // Sort transactions by timestamp (most recent first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 20 results
    const result = transactions.slice(0, 20);
    
    // Update cache
    setWhaleTransactionsCache(result, timeframe, 'exchange');
    
    return result;
  } catch (error) {
    console.error('Error fetching whale transactions:', error);
    toast.error(`Error getting large transaction data: ${error.message}`);
    throw error; // Propagate the error
  }
};
