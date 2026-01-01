/**
 * Unit tests for Market News Service
 * Tests API consumption with mocks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMarketNews } from '../../features/market-news/service';

// Mock the API module
vi.mock('@/services/api', () => ({
  fetchMarketNews: vi.fn(),
}));

import { fetchMarketNews as mockFetchMarketNews } from '@/services/api';

describe('Market News Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transform CryptoPanic API response correctly', async () => {
    const mockResponse = [
      {
        id: 123,
        title: 'Test News Title',
        body: 'This is the news body',
        source: { title: 'Reuters' },
        published_at: '2024-01-15T10:00:00Z',
        kind: 'news',
        url: 'https://example.com/news/1',
      },
    ];

    (mockFetchMarketNews as any).mockResolvedValue(mockResponse);

    const result = await fetchMarketNews();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: '123',
      title: 'Test News Title',
      summary: 'This is the news body',
      source: 'Reuters',
      publishedAt: '2024-01-15T10:00:00Z',
      category: 'news',
      url: 'https://example.com/news/1',
    });
  });

  it('should handle API error gracefully (return empty array)', async () => {
    (mockFetchMarketNews as any).mockRejectedValue(new Error('API Error'));

    const result = await fetchMarketNews();

    expect(result).toEqual([]);
  });

  it('should handle empty API response', async () => {
    (mockFetchMarketNews as any).mockResolvedValue([]);

    const result = await fetchMarketNews();

    expect(result).toEqual([]);
  });

  it('should handle null/undefined API response', async () => {
    (mockFetchMarketNews as any).mockResolvedValue(null);

    const result = await fetchMarketNews();

    expect(result).toEqual([]);
  });

  it('should handle missing optional fields', async () => {
    const mockResponse = [
      {
        id: 456,
        title: 'Minimal News',
        published_at: '2024-01-15T11:00:00Z',
      },
    ];

    (mockFetchMarketNews as any).mockResolvedValue(mockResponse);

    const result = await fetchMarketNews();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('456');
    expect(result[0].title).toBe('Minimal News');
    expect(result[0].summary).toBe('');
    expect(result[0].source).toBe('Unknown');
  });

  it('should use domain as fallback for source', async () => {
    const mockResponse = [
      {
        id: 789,
        title: 'News without source object',
        domain: 'bloomberg.com',
        published_at: '2024-01-15T12:00:00Z',
      },
    ];

    (mockFetchMarketNews as any).mockResolvedValue(mockResponse);

    const result = await fetchMarketNews();

    expect(result[0].source).toBe('bloomberg.com');
  });

  it('should use slug as fallback for id', async () => {
    const mockResponse = [
      {
        slug: 'test-news-slug',
        title: 'News with slug only',
        published_at: '2024-01-15T13:00:00Z',
      },
    ];

    (mockFetchMarketNews as any).mockResolvedValue(mockResponse);

    const result = await fetchMarketNews();

    expect(result[0].id).toBe('test-news-slug');
  });
});
