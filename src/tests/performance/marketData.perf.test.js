
import { describe, bench } from 'vitest';
import { fetchMarketData } from '../../services/marketService';

describe('Market Data Performance', () => {
  bench('fetchMarketData performance', async () => {
    await fetchMarketData('bitcoin', 30);
  }, {
    iterations: 10,
    time: 1000,
  });
});
