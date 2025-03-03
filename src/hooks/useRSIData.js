
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner";
import { calculateRSI } from '../utils/rsiCalculator';
import { logError } from '../utils/logger';

const TOP_CRYPTOS = [
  'bitcoin',
  'ethereum',
  'cardano',
  'polkadot'
];

export const useRSIData = () => {
  return useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      const rsiData = {};
      let delay = 0;
      let errors = [];
      
      for (const crypto of TOP_CRYPTOS) {
        try {
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          delay = 1000; // Add delay between requests to avoid rate limiting
          
          console.log(`Fetching RSI data for ${crypto}`);
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart`,
            {
              params: {
                vs_currency: 'usd',
                days: 14,
                interval: 'daily'
              },
              timeout: 15000 // Increased timeout to 15 seconds
            }
          );
          
          if (!response.data?.prices) {
            console.error(`No price data available for ${crypto}`);
            errors.push(`No price data available for ${crypto}`);
            continue;
          }

          const rsi = calculateRSI(response.data.prices);
          rsiData[crypto] = rsi;
          console.log(`RSI calculated for ${crypto}:`, rsi);
        } catch (error) {
          console.error(`Error calculating RSI for ${crypto}:`, error);
          logError(error, { context: 'RSI calculation', crypto });
          errors.push(crypto);
          // Continue to next crypto instead of throwing
        }
      }
      
      // Only throw if we couldn't get ANY data
      if (Object.keys(rsiData).length === 0) {
        const errorMessage = "Failed to fetch RSI data for all cryptocurrencies";
        toast.error(errorMessage, { 
          description: "Check your network connection and try again"
        });
        throw new Error(errorMessage);
      }
      
      // Show toast for partial failures but return what we have
      if (errors.length > 0) {
        toast.error(`Failed to calculate RSI for some cryptos: ${errors.join(', ')}`, {
          description: "Showing partial data"
        });
      }
      
      return rsiData;
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 240000, // 4 minutes
    cacheTime: 60000 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      logError(error, { context: 'RSI Data Hook' });
      toast.error("Error loading RSI data", {
        description: "Please check your network connection and try again"
      });
    }
  });
};
