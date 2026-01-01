/**
 * Types for the Market News feature
 * Contracts and interfaces following the spec
 */

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  source: string;
  publishedAt: string;
  category?: string;
  url?: string;
}

export interface ClassifiedNewsItem extends NewsItem {
  impactLevel: 'high' | 'medium' | 'low';
  impactScore: number;
}

export type NewsState = {
  status: 'loading' | 'success' | 'error' | 'empty';
  data: ClassifiedNewsItem[];
  error?: string;
};
