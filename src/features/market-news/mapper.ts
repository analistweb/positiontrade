/**
 * News Impact Mapper
 * Classifies news by their potential impact on Bitcoin
 * 
 * Priority 1 (HIGH): Monetary policy, interest rates, inflation, FED, DXY, banking crises
 * Priority 2 (MEDIUM): Geopolitics, wars, political leaders, international tensions
 * Priority 3 (LOW): Everything else
 */

import type { NewsItem, ClassifiedNewsItem } from './types';

// Keywords for HIGH impact (Priority 1)
const HIGH_IMPACT_KEYWORDS = [
  // Monetary Policy
  'fed', 'federal reserve', 'fomc', 'jerome powell', 'powell',
  'interest rate', 'taxa de juros', 'juros',
  'inflation', 'inflação', 'cpi', 'ppi',
  'monetary policy', 'política monetária',
  'quantitative easing', 'qe', 'tapering',
  'dollar', 'dólar', 'dxy', 'usd',
  // Banking
  'bank crisis', 'crise bancária', 'bank run', 'corrida bancária',
  'bank failure', 'falência de banco', 'svb', 'silicon valley bank',
  'credit suisse', 'banking collapse',
  // Treasury
  'treasury', 'tesouro', 'yield', 'bond', 'títulos',
  'debt ceiling', 'teto da dívida',
];

// Keywords for MEDIUM impact (Priority 2)
const MEDIUM_IMPACT_KEYWORDS = [
  // Geopolitics
  'war', 'guerra', 'conflict', 'conflito',
  'sanction', 'sanção', 'embargo',
  'geopolitical', 'geopolítica',
  // Political leaders
  'trump', 'biden', 'xi jinping', 'putin',
  'president', 'presidente',
  // International tensions
  'china', 'russia', 'rússia', 'iran', 'irã',
  'nato', 'otan', 'military', 'militar',
  'trade war', 'guerra comercial', 'tariff', 'tarifa',
  // Regulatory
  'sec', 'regulation', 'regulação', 'regulamentação',
  'etf', 'bitcoin etf', 'spot etf',
];

/**
 * Calculate impact score based on keyword matches
 */
function calculateImpactScore(text: string): { level: 'high' | 'medium' | 'low'; score: number } {
  const lowerText = text.toLowerCase();
  
  // Check HIGH impact keywords
  let highMatches = 0;
  for (const keyword of HIGH_IMPACT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      highMatches++;
    }
  }
  
  if (highMatches > 0) {
    return { level: 'high', score: 100 + highMatches * 10 };
  }
  
  // Check MEDIUM impact keywords
  let mediumMatches = 0;
  for (const keyword of MEDIUM_IMPACT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      mediumMatches++;
    }
  }
  
  if (mediumMatches > 0) {
    return { level: 'medium', score: 50 + mediumMatches * 5 };
  }
  
  // Default to LOW
  return { level: 'low', score: 10 };
}

/**
 * Classify a single news item by impact
 */
export function classifyNewsItem(news: NewsItem): ClassifiedNewsItem {
  const textToAnalyze = `${news.title} ${news.summary || ''} ${news.category || ''}`;
  const { level, score } = calculateImpactScore(textToAnalyze);
  
  return {
    ...news,
    impactLevel: level,
    impactScore: score,
  };
}

/**
 * Classify and sort news by impact (highest first)
 * Within same impact level, sort by publishedAt (newest first)
 */
export function classifyAndSortNews(news: NewsItem[]): ClassifiedNewsItem[] {
  const classified = news.map(classifyNewsItem);
  
  return classified.sort((a, b) => {
    // First, sort by impact score (descending)
    if (b.impactScore !== a.impactScore) {
      return b.impactScore - a.impactScore;
    }
    
    // Then by date (newest first)
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * Export keywords for testing purposes
 */
export const IMPACT_KEYWORDS = {
  high: HIGH_IMPACT_KEYWORDS,
  medium: MEDIUM_IMPACT_KEYWORDS,
};
