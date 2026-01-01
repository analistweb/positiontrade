/**
 * Market News Module
 * Public API for the market news feature
 * 
 * This module is designed to be pluggable and removable
 */

export { MarketNewsSection } from './MarketNewsSection';
export { useMarketNews } from './useMarketNews';
export { classifyNewsItem, classifyAndSortNews, IMPACT_KEYWORDS } from './mapper';
export type { NewsItem, ClassifiedNewsItem, NewsState } from './types';
