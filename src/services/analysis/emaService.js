
export const calculateEMA = (prices, period = 14) => {
  if (!prices || prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

export const getWeeklyData = (prices) => {
  if (!prices || !prices.length) return [];
  
  const weeklyData = [];
  let currentWeek = {
    high: -Infinity,
    low: Infinity,
    open: null,
    close: null
  };
  
  prices.forEach(([timestamp, price], index) => {
    const date = new Date(timestamp);
    
    if (index === 0) {
      currentWeek.open = price;
    }
    
    currentWeek.high = Math.max(currentWeek.high, price);
    currentWeek.low = Math.min(currentWeek.low, price);
    
    if (date.getDay() === 6 || index === prices.length - 1) {
      currentWeek.close = price;
      weeklyData.push({ ...currentWeek });
      currentWeek = {
        high: -Infinity,
        low: Infinity,
        open: price,
        close: null
      };
    }
  });
  
  return weeklyData;
};
