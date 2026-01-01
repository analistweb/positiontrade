/**
 * Market News Hook
 * Manages state and data fetching for market news
 */

import { useQuery } from '@tanstack/react-query';
import { fetchMarketNews } from './service';
import { classifyAndSortNews } from './mapper';
import type { NewsState, ClassifiedNewsItem } from './types';

const MAX_NEWS_ITEMS = 5;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useMarketNews(): NewsState {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['market-news-bitcoin-impact'],
    queryFn: fetchMarketNews,
    staleTime: STALE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
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

  // Success - classify and limit to MAX_NEWS_ITEMS
  const classifiedNews: ClassifiedNewsItem[] = classifyAndSortNews(data).slice(0, MAX_NEWS_ITEMS);

  return {
    status: 'success',
    data: classifiedNews,
  };
}
