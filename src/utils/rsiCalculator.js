
import { RSI } from 'technicalindicators';

export const calculateRSI = (prices) => {
  if (!prices || !Array.isArray(prices) || prices.length < 14) {
    console.log('Invalid price data for RSI calculation. Need at least 14 data points:', prices);
    return null;
  }
  
  try {
    // Extract price values from [timestamp, price] format
    const values = prices.map(price => price[1]);
    
    // Calculate RSI using the technicalindicators library
    const rsiValues = RSI.calculate({
      values: values,
      period: 14
    });
    
    // Return the most recent RSI value
    return rsiValues[rsiValues.length - 1];
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return null;
  }
};
