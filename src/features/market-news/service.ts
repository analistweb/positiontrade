/**
 * Market News Service
 * Handles API consumption and data transformation
 * 
 * Uses the existing fetchMarketNews from api.js
 * Transforms data to the expected NewsItem format
 */

import type { NewsItem } from './types';
import { fetchMarketNews as fetchCryptoPanicNews } from '@/services/api';

/**
 * Transform CryptoPanic API response to our NewsItem format
 */
function transformCryptoPanicResponse(results: any[]): NewsItem[] {
  if (!Array.isArray(results)) {
    return [];
  }
  
  return results.map((item) => ({
    id: String(item.id || item.slug || Math.random()),
    title: item.title || '',
    summary: item.body || item.description || '',
    source: item.source?.title || item.domain || 'Unknown',
    publishedAt: item.published_at || item.created_at || new Date().toISOString(),
    category: item.kind || item.type || undefined,
    url: item.url || undefined,
  }));
}

/**
 * Fetch market news from the existing API
 * Returns empty array on error (graceful degradation)
 */
export async function fetchMarketNews(): Promise<NewsItem[]> {
  try {
    const response = await fetchCryptoPanicNews();
    return transformCryptoPanicResponse(response);
  } catch (error) {
    // Log error but don't throw - return empty array for graceful degradation
    console.warn('[MarketNews] Failed to fetch news:', error);
    return [];
  }
}
