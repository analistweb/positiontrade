import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchETHUSDTData } from '@/services/binanceService';

vi.mock('axios');

describe('binanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchETHUSDTData', () => {
    it('deve fazer requisição para a API da Binance com parâmetros corretos', async () => {
      const mockResponse = {
        data: [
          [1609459200000, '730.00', '735.00', '725.00', '732.00', '1000.00'],
          [1609459800000, '732.00', '740.00', '730.00', '738.00', '1200.00']
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      await fetchETHUSDTData('15m', 100);

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/klines',
        {
          params: {
            symbol: 'ETHUSDT',
            interval: '15m',
            limit: 100
          }
        }
      );
    });

    it('deve transformar dados da API no formato correto', async () => {
      const mockResponse = {
        data: [
          [1609459200000, '730.00', '735.00', '725.00', '732.00', '1000.00'],
          [1609459800000, '732.00', '740.00', '730.00', '738.00', '1200.00']
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await fetchETHUSDTData();

      expect(result).toEqual([
        {
          timestamp: 1609459200000,
          open: 730.00,
          high: 735.00,
          low: 725.00,
          close: 732.00,
          volume: 1000.00
        },
        {
          timestamp: 1609459800000,
          open: 732.00,
          high: 740.00,
          low: 730.00,
          close: 738.00,
          volume: 1200.00
        }
      ]);
    });

    it('deve usar valores padrão quando não especificados', async () => {
      const mockResponse = { data: [] };
      axios.get.mockResolvedValue(mockResponse);

      await fetchETHUSDTData();

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/klines',
        {
          params: {
            symbol: 'ETHUSDT',
            interval: '15m',
            limit: 100
          }
        }
      );
    });

    it('deve aceitar diferentes intervalos', async () => {
      const mockResponse = { data: [] };
      axios.get.mockResolvedValue(mockResponse);

      await fetchETHUSDTData('1h', 50);

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/klines',
        {
          params: {
            symbol: 'ETHUSDT',
            interval: '1h',
            limit: 50
          }
        }
      );
    });

    it('deve lançar erro quando a API falha', async () => {
      const errorMessage = 'Network Error';
      axios.get.mockRejectedValue(new Error(errorMessage));

      await expect(fetchETHUSDTData()).rejects.toThrow('Falha ao carregar dados de mercado ETHUSDT');
    });

    it('deve converter strings para números corretamente', async () => {
      const mockResponse = {
        data: [
          ['1609459200000', '3500.123', '3550.456', '3450.789', '3525.111', '1234.567']
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await fetchETHUSDTData();

      expect(result[0].open).toBe(3500.123);
      expect(result[0].high).toBe(3550.456);
      expect(result[0].low).toBe(3450.789);
      expect(result[0].close).toBe(3525.111);
      expect(result[0].volume).toBe(1234.567);
      expect(typeof result[0].timestamp).toBe('number');
    });

    it('deve lidar com resposta vazia', async () => {
      const mockResponse = { data: [] };
      axios.get.mockResolvedValue(mockResponse);

      const result = await fetchETHUSDTData();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve manter a ordem dos dados', async () => {
      const mockResponse = {
        data: [
          [1609459200000, '730.00', '735.00', '725.00', '732.00', '1000.00'],
          [1609459800000, '732.00', '740.00', '730.00', '738.00', '1200.00'],
          [1609460400000, '738.00', '745.00', '735.00', '742.00', '1300.00']
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await fetchETHUSDTData();

      expect(result.length).toBe(3);
      expect(result[0].timestamp).toBe(1609459200000);
      expect(result[1].timestamp).toBe(1609459800000);
      expect(result[2].timestamp).toBe(1609460400000);
    });
  });
});
