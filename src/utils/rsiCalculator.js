import { RSI } from 'technicalindicators';

export const calculateRSI = (prices) => {
  if (!prices || !Array.isArray(prices) || prices.length < 14) {
    console.log('Invalid price data for RSI calculation:', prices);
    return null;
  }
  
  try {
    const values = prices.map(price => price[1]);
    const rsiValues = RSI.calculate({
      values: values,
      period: 14
    });
    return rsiValues[rsiValues.length - 1];
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return null;
  }
};