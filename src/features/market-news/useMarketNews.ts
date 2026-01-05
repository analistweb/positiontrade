/**
 * Market News Hook
 * Manages state and data fetching for market news
 */

import { useQuery } from '@tanstack/react-query';
import { fetchMarketNews } from './service';
import { classifyNewsItem } from './mapper';
import type { NewsState, ClassifiedNewsItem, NewsItem } from './types';

const MAX_NEWS_ITEMS = 5;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes for real-time updates

export function useMarketNews(): NewsState {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['market-news-bitcoin-impact'],
    queryFn: fetchMarketNews,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  // Loading state
  if (isLoading) {
    return { status: 'loading', data: [] };
  }

  // Error state (API failed completely)
  if (isError) {
    return {
      status: 'error',
      data: [],
      error: error instanceof Error ? error.message : 'Erro ao carregar notícias',
    };
  }

  // No data or empty array
  if (!data || data.length === 0) {
    return { status: 'empty', data: [] };
  }

  // Process news - use pre-classified impact if available, otherwise classify locally
  const classifiedNews: ClassifiedNewsItem[] = data.map((item: NewsItem & { impactLevel?: string }) => {
    // If already classified by the edge function, use that
    if (item.impactLevel && ['high', 'medium', 'low'].includes(item.impactLevel)) {
      return {
        ...item,
        impactLevel: item.impactLevel as 'high' | 'medium' | 'low',
        impactScore: item.impactLevel === 'high' ? 100 : item.impactLevel === 'medium' ? 50 : 10,
      };
    }
    // Otherwise, classify locally using the mapper
    return classifyNewsItem(item);
  });

  // Sort by impact score (highest first), then by date (newest first)
  const sortedNews = classifiedNews
    .sort((a, b) => {
      if (b.impactScore !== a.impactScore) {
        return b.impactScore - a.impactScore;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, MAX_NEWS_ITEMS);

  return {
    status: 'success',
    data: sortedNews,
  };
}
