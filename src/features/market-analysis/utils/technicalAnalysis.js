import { RSI } from 'technicalindicators';

export const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length < period) return null;
  
  const values = prices.map(price => price[1]);
  const rsiValues = RSI.calculate({
    values,
    period
  });
  
  return rsiValues[rsiValues.length - 1];
};

export const calculateEMA = (prices, period = 56) => {
  if (!prices || prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};