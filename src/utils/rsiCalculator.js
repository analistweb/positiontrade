
import { RSI } from 'technicalindicators';

export const calculateRSI = (prices) => {
  if (!prices || !Array.isArray(prices) || prices.length < 14) {
    console.log('Invalid price data for RSI calculation:', prices);
    return null;
  }
  
  try {
    // Extrai apenas os valores de preço do array [timestamp, price]
    const values = prices.map(price => price[1]);
    
    // Calcula o RSI usando a biblioteca technicalindicators
    const rsiValues = RSI.calculate({
      values: values,
      period: 14
    });
    
    // Retorna o valor mais recente do RSI
    return rsiValues[rsiValues.length - 1];
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return null;
  }
};
