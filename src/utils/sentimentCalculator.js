export const calculateSentimentScore = (marketData) => {
  let score = 50; // Score base

  // Ajusta score baseado na variação de preço
  if (marketData.market_data.price_change_percentage_24h > 0) {
    score += 10;
  } else {
    score -= 10;
  }

  // Ajusta score baseado no volume
  if (marketData.market_data.total_volume.usd > marketData.market_data.market_cap.usd * 0.1) {
    score += 10;
  }

  // Ajusta score baseado na dominância
  if (marketData.market_data.market_cap_percentage > 45) {
    score += 10;
  }

  // Limita o score entre 0 e 100
  return Math.max(0, Math.min(100, score));
};