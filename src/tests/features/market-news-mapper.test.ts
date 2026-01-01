/**
 * Unit tests for Market News Mapper
 * Tests the impact classification logic
 */

import { describe, it, expect } from 'vitest';
import { 
  classifyNewsItem, 
  classifyAndSortNews, 
  IMPACT_KEYWORDS 
} from '../../features/market-news/mapper';

describe('Market News Mapper', () => {
  describe('classifyNewsItem', () => {
    it('should classify FED news as HIGH impact', () => {
      const news = {
        id: '1',
        title: 'Federal Reserve raises interest rates by 0.25%',
        source: 'Reuters',
        publishedAt: '2024-01-15T10:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('high');
      expect(classified.impactScore).toBeGreaterThanOrEqual(100);
    });

    it('should classify Powell news as HIGH impact', () => {
      const news = {
        id: '2',
        title: 'Jerome Powell signals more rate hikes ahead',
        source: 'Bloomberg',
        publishedAt: '2024-01-15T11:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('high');
    });

    it('should classify inflation news as HIGH impact', () => {
      const news = {
        id: '3',
        title: 'US Inflation data shows CPI rising 3.4%',
        source: 'CNBC',
        publishedAt: '2024-01-15T12:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('high');
    });

    it('should classify banking crisis news as HIGH impact', () => {
      const news = {
        id: '4',
        title: 'Regional bank faces potential failure amid deposits outflow',
        summary: 'The bank crisis continues as more institutions struggle',
        source: 'WSJ',
        publishedAt: '2024-01-15T13:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('high');
    });

    it('should classify war/geopolitical news as MEDIUM impact', () => {
      const news = {
        id: '5',
        title: 'Tensions rise in the Middle East as conflict escalates',
        summary: 'War concerns grow among investors',
        source: 'BBC',
        publishedAt: '2024-01-15T14:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('medium');
    });

    it('should classify Trump news as MEDIUM impact', () => {
      const news = {
        id: '6',
        title: 'Trump announces new tariff policy on China imports',
        source: 'Fox News',
        publishedAt: '2024-01-15T15:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('medium');
    });

    it('should classify ETF news as MEDIUM impact', () => {
      const news = {
        id: '7',
        title: 'SEC reviews new Bitcoin ETF applications',
        source: 'CoinDesk',
        publishedAt: '2024-01-15T16:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('medium');
    });

    it('should classify generic crypto news as LOW impact', () => {
      const news = {
        id: '8',
        title: 'New cryptocurrency project launches on Ethereum',
        source: 'CryptoNews',
        publishedAt: '2024-01-15T17:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('low');
    });

    it('should preserve original news properties', () => {
      const news = {
        id: 'test-123',
        title: 'Test news',
        summary: 'Test summary',
        source: 'Test Source',
        publishedAt: '2024-01-15T10:00:00Z',
        category: 'test',
        url: 'https://test.com',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.id).toBe(news.id);
      expect(classified.title).toBe(news.title);
      expect(classified.summary).toBe(news.summary);
      expect(classified.source).toBe(news.source);
      expect(classified.publishedAt).toBe(news.publishedAt);
      expect(classified.category).toBe(news.category);
      expect(classified.url).toBe(news.url);
    });

    it('should use category for classification if present', () => {
      const news = {
        id: '9',
        title: 'Some generic news',
        category: 'Federal Reserve Policy Update',
        source: 'Test',
        publishedAt: '2024-01-15T18:00:00Z',
      };

      const classified = classifyNewsItem(news);
      
      expect(classified.impactLevel).toBe('high');
    });
  });

  describe('classifyAndSortNews', () => {
    it('should sort news by impact level (high first)', () => {
      const news = [
        { id: '1', title: 'Generic crypto news', source: 'A', publishedAt: '2024-01-15T10:00:00Z' },
        { id: '2', title: 'FED raises rates', source: 'B', publishedAt: '2024-01-15T09:00:00Z' },
        { id: '3', title: 'Trump announces tariffs', source: 'C', publishedAt: '2024-01-15T08:00:00Z' },
      ];

      const sorted = classifyAndSortNews(news);
      
      expect(sorted[0].impactLevel).toBe('high'); // FED news
      expect(sorted[1].impactLevel).toBe('medium'); // Trump news
      expect(sorted[2].impactLevel).toBe('low'); // Generic news
    });

    it('should sort by date within same impact level', () => {
      const news = [
        { id: '1', title: 'FED old news', source: 'A', publishedAt: '2024-01-10T10:00:00Z' },
        { id: '2', title: 'FED new news', source: 'B', publishedAt: '2024-01-15T10:00:00Z' },
      ];

      const sorted = classifyAndSortNews(news);
      
      expect(sorted[0].id).toBe('2'); // Newer news first
      expect(sorted[1].id).toBe('1');
    });

    it('should handle empty array', () => {
      const sorted = classifyAndSortNews([]);
      
      expect(sorted).toEqual([]);
    });

    it('should handle news with multiple HIGH impact keywords', () => {
      const news = [
        { id: '1', title: 'FED inflation rate', source: 'A', publishedAt: '2024-01-15T10:00:00Z' },
        { id: '2', title: 'FED news', source: 'B', publishedAt: '2024-01-15T10:00:00Z' },
      ];

      const sorted = classifyAndSortNews(news);
      
      // News with more keyword matches should have higher score
      expect(sorted[0].id).toBe('1');
      expect(sorted[0].impactScore).toBeGreaterThan(sorted[1].impactScore);
    });
  });

  describe('IMPACT_KEYWORDS', () => {
    it('should export HIGH impact keywords', () => {
      expect(IMPACT_KEYWORDS.high).toContain('fed');
      expect(IMPACT_KEYWORDS.high).toContain('inflation');
      expect(IMPACT_KEYWORDS.high).toContain('interest rate');
    });

    it('should export MEDIUM impact keywords', () => {
      expect(IMPACT_KEYWORDS.medium).toContain('war');
      expect(IMPACT_KEYWORDS.medium).toContain('trump');
      expect(IMPACT_KEYWORDS.medium).toContain('etf');
    });
  });
});
