
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  getValidCache, 
  setCacheData, 
  clearCache, 
  getCacheSize,
  getCacheStatus,
  CACHE_DURATION 
} from '../../config/apiCache';

describe('API Cache', () => {
  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
  });

  test('cache operations work correctly', () => {
    const testData = { test: 'data' };
    const testKey = 'testKey';

    setCacheData(testKey, testData);
    expect(getCacheSize()).toBe(1);
    expect(getValidCache(testKey)).toEqual(testData);
  });

  test('cache expiration works', () => {
    const testData = { test: 'data' };
    const testKey = 'testKey';

    setCacheData(testKey, testData);
    expect(getValidCache(testKey)).toEqual(testData);

    // Advance time past cache duration
    vi.advanceTimersByTime(CACHE_DURATION + 1000);
    expect(getValidCache(testKey)).toBeNull();
  });

  test('getCacheStatus returns correct status', () => {
    const testData = { test: 'data' };
    setCacheData('test1', testData);

    const status = getCacheStatus();
    expect(status).toHaveLength(1);
    expect(status[0]).toHaveProperty('key', 'test1');
    expect(status[0]).toHaveProperty('isValid', true);
  });

  test('clearCache removes all cached data', () => {
    setCacheData('test1', { data: 1 });
    setCacheData('test2', { data: 2 });
    expect(getCacheSize()).toBe(2);

    clearCache();
    expect(getCacheSize()).toBe(0);
  });
});
