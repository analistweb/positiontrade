import { describe, it, expect } from 'vitest';
import {
  calculateDidiIndex,
  calculateDMI,
  calculateEMA,
  calculateATR
} from '@/utils/technicalIndicators';

describe('Technical Indicators', () => {
  describe('calculateDidiIndex', () => {
    it('deve calcular médias móveis simples corretamente', () => {
      const closes = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 
                      110, 112, 111, 113, 115, 114, 116, 118, 117, 119, 120];
      
      const result = calculateDidiIndex(closes);

      expect(result).toHaveProperty('short');
      expect(result).toHaveProperty('medium');
      expect(result).toHaveProperty('long');
      expect(Array.isArray(result.short)).toBe(true);
      expect(Array.isArray(result.medium)).toBe(true);
      expect(Array.isArray(result.long)).toBe(true);
    });

    it('deve ter tamanhos de array corretos para cada período', () => {
      const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
      
      const result = calculateDidiIndex(closes);

      // SMA(3) deve ter 28 valores (30 - 3 + 1)
      expect(result.short.length).toBe(28);
      // SMA(8) deve ter 23 valores (30 - 8 + 1)
      expect(result.medium.length).toBe(23);
      // SMA(20) deve ter 11 valores (30 - 20 + 1)
      expect(result.long.length).toBe(11);
    });

    it('deve calcular SMA(3) corretamente', () => {
      const closes = [10, 20, 30, 40];
      const result = calculateDidiIndex(closes);
      
      // SMA(3) para [10,20,30] = 20
      expect(result.short[0]).toBe(20);
      // SMA(3) para [20,30,40] = 30
      expect(result.short[1]).toBe(30);
    });
  });

  describe('calculateDMI', () => {
    const highs = [110, 112, 115, 113, 116, 118, 120, 119, 122, 125, 
                   127, 126, 129, 131, 130, 133, 135, 137];
    const lows = [100, 102, 103, 101, 104, 106, 108, 107, 110, 112, 
                  114, 113, 116, 118, 117, 120, 122, 124];
    const closes = [105, 107, 109, 106, 110, 112, 114, 113, 116, 119, 
                    121, 120, 123, 125, 124, 127, 129, 131];

    it('deve retornar array de objetos com plusDI, minusDI e ADX', () => {
      const result = calculateDMI(highs, lows, closes, 14);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('plusDI');
      expect(result[0]).toHaveProperty('minusDI');
      expect(result[0]).toHaveProperty('adx');
    });

    it('deve ter valores de DI entre 0 e 100', () => {
      const result = calculateDMI(highs, lows, closes, 14);

      result.forEach(dmi => {
        expect(dmi.plusDI).toBeGreaterThanOrEqual(0);
        expect(dmi.plusDI).toBeLessThanOrEqual(100);
        expect(dmi.minusDI).toBeGreaterThanOrEqual(0);
        expect(dmi.minusDI).toBeLessThanOrEqual(100);
      });
    });

    it('deve calcular ADX como número positivo', () => {
      const result = calculateDMI(highs, lows, closes, 14);

      result.forEach(dmi => {
        expect(dmi.adx).toBeGreaterThanOrEqual(0);
        expect(typeof dmi.adx).toBe('number');
      });
    });
  });

  describe('calculateEMA', () => {
    it('deve calcular EMA corretamente', () => {
      const closes = [100, 102, 104, 103, 105];
      const result = calculateEMA(closes, 3);

      expect(result.length).toBe(closes.length);
      expect(result[0]).toBe(100); // Primeiro valor = primeiro preço
    });

    it('deve ter suavização crescente', () => {
      const closes = [100, 110, 120, 130, 140];
      const result = calculateEMA(closes, 3);

      // EMA deve seguir a tendência de alta
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThan(result[i - 1]);
      }
    });

    it('deve reagir a mudanças de preço', () => {
      const closes = [100, 100, 100, 110, 110];
      const result = calculateEMA(closes, 3);

      // EMA deve aumentar após o salto de preço
      expect(result[3]).toBeGreaterThan(result[2]);
      expect(result[4]).toBeGreaterThan(result[3]);
    });
  });

  describe('calculateATR', () => {
    const highs = [110, 112, 115, 113, 116, 118, 120, 119, 122, 125, 
                   127, 126, 129, 131, 130, 133, 135, 137];
    const lows = [100, 102, 103, 101, 104, 106, 108, 107, 110, 112, 
                  114, 113, 116, 118, 117, 120, 122, 124];
    const closes = [105, 107, 109, 106, 110, 112, 114, 113, 116, 119, 
                    121, 120, 123, 125, 124, 127, 129, 131];

    it('deve retornar array de valores positivos', () => {
      const result = calculateATR(highs, lows, closes, 14);

      expect(Array.isArray(result)).toBe(true);
      result.forEach(atr => {
        expect(atr).toBeGreaterThan(0);
        expect(typeof atr).toBe('number');
      });
    });

    it('deve ter tamanho correto baseado no período', () => {
      const result = calculateATR(highs, lows, closes, 14);
      
      // ATR começa após período-1 valores de TR
      expect(result.length).toBeLessThan(closes.length);
    });

    it('deve refletir volatilidade do mercado', () => {
      // Alta volatilidade
      const highVolHighs = [100, 120, 95, 130, 90];
      const highVolLows = [90, 95, 85, 100, 80];
      const highVolCloses = [95, 110, 90, 120, 85];

      const highVolATR = calculateATR(highVolHighs, highVolLows, highVolCloses, 3);

      // Baixa volatilidade
      const lowVolHighs = [101, 102, 103, 104, 105];
      const lowVolLows = [99, 100, 101, 102, 103];
      const lowVolCloses = [100, 101, 102, 103, 104];

      const lowVolATR = calculateATR(lowVolHighs, lowVolLows, lowVolCloses, 3);

      // ATR de alta volatilidade deve ser maior
      const avgHighVol = highVolATR.reduce((a, b) => a + b, 0) / highVolATR.length;
      const avgLowVol = lowVolATR.reduce((a, b) => a + b, 0) / lowVolATR.length;

      expect(avgHighVol).toBeGreaterThan(avgLowVol);
    });
  });

  describe('Integração de Indicadores', () => {
    it('deve calcular todos os indicadores sem erros', () => {
      const closes = Array.from({ length: 100 }, (_, i) => 3500 + Math.random() * 100);
      const highs = closes.map(c => c + 10 + Math.random() * 20);
      const lows = closes.map(c => c - 10 - Math.random() * 20);

      const didi = calculateDidiIndex(closes);
      const dmi = calculateDMI(highs, lows, closes, 14);
      const ema = calculateEMA(closes, 50);
      const atr = calculateATR(highs, lows, closes, 14);

      expect(didi.short.length).toBeGreaterThan(0);
      expect(dmi.length).toBeGreaterThan(0);
      expect(ema.length).toBe(100);
      expect(atr.length).toBeGreaterThan(0);
    });
  });
});
