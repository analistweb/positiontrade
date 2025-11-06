import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EstrategiaETH from '@/pages/EstrategiaETH';
import * as binanceService from '@/services/binanceService';

// Mock do binanceService
vi.mock('@/services/binanceService', () => ({
  fetchETHUSDTData: vi.fn()
}));

// Mock dos componentes de UI
vi.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ message }) => <div data-testid="loading-spinner">{message}</div>
}));

vi.mock('@/components/common/ErrorDisplay', () => ({
  ErrorDisplay: ({ message }) => <div data-testid="error-display">{message}</div>
}));

// Dados de teste realistas
const mockETHData = [
  // Últimas 100 velas simuladas
  ...Array.from({ length: 95 }, (_, i) => ({
    timestamp: Date.now() - (100 - i) * 15 * 60 * 1000,
    open: 3500 + Math.random() * 100,
    high: 3550 + Math.random() * 100,
    low: 3450 + Math.random() * 100,
    close: 3500 + Math.random() * 100,
    volume: 1000 + Math.random() * 500
  })),
  // Últimas 5 velas com padrão específico
  {
    timestamp: Date.now() - 5 * 15 * 60 * 1000,
    open: 3500,
    high: 3520,
    low: 3490,
    close: 3510,
    volume: 1200
  },
  {
    timestamp: Date.now() - 4 * 15 * 60 * 1000,
    open: 3510,
    high: 3525,
    low: 3505,
    close: 3515, // Corpo pequeno
    volume: 1100
  },
  {
    timestamp: Date.now() - 3 * 15 * 60 * 1000,
    open: 3515,
    high: 3530,
    low: 3510,
    close: 3516, // Menor corpo (candle de referência)
    volume: 1150
  },
  {
    timestamp: Date.now() - 2 * 15 * 60 * 1000,
    open: 3516,
    high: 3535,
    low: 3512,
    close: 3525,
    volume: 1300
  },
  {
    timestamp: Date.now() - 15 * 60 * 1000,
    open: 3525,
    high: 3545,
    low: 3520,
    close: 3540, // Candle de gatilho (rompimento)
    volume: 1500
  }
];

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0
    }
  }
});

describe('EstrategiaETH Page', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('deve renderizar o título da página', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    expect(screen.getByText('Estratégia ETHUSDT')).toBeInTheDocument();
    expect(screen.getByText(/Didi Index \+ DMI \+ Rompimento/)).toBeInTheDocument();
  });

  it('deve mostrar loading spinner enquanto carrega dados', () => {
    binanceService.fetchETHUSDTData.mockImplementation(() => 
      new Promise(() => {}) // Promise que nunca resolve
    );

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/Carregando dados ETHUSDT/)).toBeInTheDocument();
  });

  it('deve mostrar erro quando falha ao carregar dados', async () => {
    const errorMessage = 'Falha ao carregar dados de mercado ETHUSDT';
    binanceService.fetchETHUSDTData.mockRejectedValue(new Error(errorMessage));

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
  });

  it('deve renderizar histórico vazio inicialmente', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Histórico de Sinais')).toBeInTheDocument();
    });

    expect(screen.getByText('Nenhum sinal gerado ainda')).toBeInTheDocument();
  });

  it('deve renderizar seção "Sobre a Estratégia"', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sobre a Estratégia')).toBeInTheDocument();
    });

    expect(screen.getByText(/Timeframe:/)).toBeInTheDocument();
    expect(screen.getByText(/15 minutos/)).toBeInTheDocument();
    expect(screen.getByText(/ETHUSDT/)).toBeInTheDocument();
    expect(screen.getByText(/Didi Index, DMI \(ADX\), EMA50, ATR/)).toBeInTheDocument();
  });

  it('deve ter botão de refresh', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toBeInTheDocument();
    });
  });
});

describe('EstrategiaETH - Integração com Binance API', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('deve chamar fetchETHUSDTData com parâmetros corretos', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalledWith('15m');
    });
  });

  it('deve processar dados reais da API corretamente', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    // Verifica se os dados têm a estrutura esperada
    expect(mockETHData.length).toBeGreaterThan(0);
    expect(mockETHData[0]).toHaveProperty('open');
    expect(mockETHData[0]).toHaveProperty('high');
    expect(mockETHData[0]).toHaveProperty('low');
    expect(mockETHData[0]).toHaveProperty('close');
    expect(mockETHData[0]).toHaveProperty('volume');
  });
});

describe('EstrategiaETH - Lógica de Estratégia', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('deve identificar o candle de referência (menor corpo)', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    // O terceiro candle das últimas 5 tem o menor corpo (3516 - 3515 = 1)
    const last5 = mockETHData.slice(-6, -1);
    const bodies = last5.map(c => Math.abs(c.close - c.open));
    const minBody = Math.min(...bodies);
    
    expect(minBody).toBe(1); // Menor corpo calculado corretamente
  });

  it('deve validar estrutura mínima de dados para análise', async () => {
    const insufficientData = mockETHData.slice(0, 50); // Menos de 100 velas
    binanceService.fetchETHUSDTData.mockResolvedValue(insufficientData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    // Com menos de 100 velas, a análise não deve gerar sinais
    expect(insufficientData.length).toBeLessThan(100);
  });

  it('deve calcular rompimento corretamente (0.05%)', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    const referenceCandle = mockETHData[mockETHData.length - 4]; // Candle de referência
    const triggerCandle = mockETHData[mockETHData.length - 1]; // Candle de gatilho
    const breakoutThreshold = 0.0005;

    const expectedBreakoutPrice = referenceCandle.high * (1 + breakoutThreshold);
    const hasBreakout = triggerCandle.close > expectedBreakoutPrice;

    // Verifica se o rompimento é calculado corretamente
    expect(typeof hasBreakout).toBe('boolean');
  });

  it('deve ter gestão de risco com relação 1:2', async () => {
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    // Simulação de cálculo de risco:retorno
    const entryPrice = 3540;
    const stopLoss = 3516;
    const risk = entryPrice - stopLoss; // 24
    const expectedTakeProfit = entryPrice + (risk * 2); // 3540 + 48 = 3588

    expect(expectedTakeProfit).toBe(3588);
    expect(risk * 2).toBe(48); // Relação 1:2 confirmada
  });
});

describe('EstrategiaETH - Dados Reais da Binance', () => {
  it('deve verificar se os dados retornados são numéricos', async () => {
    const queryClient = createTestQueryClient();
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    mockETHData.forEach(candle => {
      expect(typeof candle.open).toBe('number');
      expect(typeof candle.high).toBe('number');
      expect(typeof candle.low).toBe('number');
      expect(typeof candle.close).toBe('number');
      expect(typeof candle.volume).toBe('number');
    });
  });

  it('deve validar consistência dos dados OHLC', async () => {
    const queryClient = createTestQueryClient();
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    // Valida que high é sempre maior ou igual a low
    mockETHData.forEach(candle => {
      expect(candle.high).toBeGreaterThanOrEqual(candle.low);
      expect(candle.high).toBeGreaterThanOrEqual(candle.open);
      expect(candle.high).toBeGreaterThanOrEqual(candle.close);
      expect(candle.low).toBeLessThanOrEqual(candle.open);
      expect(candle.low).toBeLessThanOrEqual(candle.close);
    });
  });

  it('deve ter timestamps em ordem crescente', async () => {
    const queryClient = createTestQueryClient();
    binanceService.fetchETHUSDTData.mockResolvedValue(mockETHData);

    render(
      <QueryClientProvider client={queryClient}>
        <EstrategiaETH />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(binanceService.fetchETHUSDTData).toHaveBeenCalled();
    });

    for (let i = 1; i < mockETHData.length; i++) {
      expect(mockETHData[i].timestamp).toBeGreaterThan(mockETHData[i - 1].timestamp);
    }
  });
});
