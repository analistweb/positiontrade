/**
 * Market News Service
 * Fetches news from the secure edge function proxy
 */

import { supabase } from '@/integrations/supabase/client';
import type { NewsItem } from './types';

/**
 * Fetch market news from the edge function
 * Returns news with direct article URLs for correct navigation
 */
export async function fetchMarketNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-news');

    if (error) {
      console.error('[MarketNews] Edge function error:', error);
      return [];
    }

    if (!data || !data.news || !Array.isArray(data.news)) {
      console.warn('[MarketNews] Invalid response format');
      return [];
    }

    // Log source for debugging
    if (data.source === 'mock') {
      console.info('[MarketNews] Using mock data - configure CRYPTOPANIC_API_KEY for real news');
    } else {
      console.info(`[MarketNews] Fetched ${data.count} real news articles`);
    }

    // Transform to NewsItem format with direct URLs and images
    return data.news.map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || '',
      source: item.source,
      publishedAt: item.publishedAt,
      category: item.category,
      url: item.url, // Direct link to the article source
      imageUrl: item.imageUrl || null, // Image from API
      impactLevel: item.impact || 'low',
    }));

  } catch (error) {
    console.error('[MarketNews] Failed to fetch news:', error);
    return [];
  }
}
