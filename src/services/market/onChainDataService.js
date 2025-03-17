
import axios from 'axios';
import { axiosInstance } from '../config/api';
import { toast } from "sonner";
import { getOnChainDataCache, setOnChainDataCache } from '../cache/cacheService';

export const fetchOnChainData = async (timeframe = '7d') => {
  const cachedData = getOnChainDataCache(timeframe);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log(`Fetching on-chain data (${timeframe})`);
    
    // Using the public blockchain.com API
    const response = await axios.get('https://api.blockchain.info/v2/blocks?format=json');
    
    if (!response.data || !response.data.blocks) {
      throw new Error("Could not get on-chain data");
    }
    
    const blocks = response.data.blocks;
    
    // Fetch prices for reference
    const btcPriceResponse = await axiosInstance.get('/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      }
    });
    
    const btcPrice = btcPriceResponse.data?.bitcoin?.usd || 50000;
    
    // Process significant transactions from blocks
    const transactions = [];
    
    for (const block of blocks) {
      if (!block.transactions || block.transactions.length === 0) continue;
      
      // Filter significant transactions (high values)
      for (const tx of block.transactions) {
        // Ignore transactions with null fee (probably mining transactions)
        if (!tx.fee || tx.fee === 0) continue;
        
        // Calculate total transaction value
        let totalValue = 0;
        for (const output of tx.outputs || []) {
          totalValue += output.value || 0;
        }
        
        // Convert satoshis to BTC
        const btcAmount = totalValue / 100000000;
        
        // Calculate USD value
        const usdValue = btcAmount * btcPrice;
        
        // Filter only significant transactions (more than $100k)
        if (usdValue < 100000) continue;
        
        // Determine origin and destination
        const fromAddress = (tx.inputs && tx.inputs[0] && tx.inputs[0].address) || "Unknown Address";
        const toAddress = (tx.outputs && tx.outputs[0] && tx.outputs[0].address) || "Unknown Address";
        
        // Add to transaction list
        transactions.push({
          timestamp: new Date(block.time * 1000).toISOString(),
          type: "Transfer",
          cryptoAmount: parseFloat(btcAmount.toFixed(4)),
          cryptoSymbol: 'BTC',
          volume: parseFloat(usdValue.toFixed(2)),
          price: parseFloat(btcPrice.toFixed(2)),
          fromAddress: fromAddress,
          fromName: "BTC Wallet",
          destinationAddress: toAddress,
          destinationName: "BTC Wallet",
          blockExplorer: `https://www.blockchain.com/explorer/transactions/btc/${tx.hash}`,
          tokenContract: "Native BTC",
          smartMoneyScore: Math.min(95, Math.max(70, Math.floor(75 + (usdValue / 1000000)))),
          transactionType: 'on-chain'
        });
        
        // Limit to 20 transactions for faster processing
        if (transactions.length >= 20) break;
      }
      
      if (transactions.length >= 20) break;
    }
    
    if (transactions.length === 0) {
      throw new Error("No significant on-chain transactions found");
    }
    
    // Update cache
    setOnChainDataCache(transactions, timeframe);
    
    return transactions;
  } catch (error) {
    console.error('Error fetching on-chain data:', error);
    toast.error(`Error getting on-chain data: ${error.message}`);
    throw error; // Propagate the error
  }
};
