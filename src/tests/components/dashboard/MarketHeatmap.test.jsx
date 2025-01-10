import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MarketHeatmap from '../../../components/dashboard/MarketHeatmap';
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('MarketHeatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza o estado de carregamento corretamente', () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    
    render(<MarketHeatmap />, { wrapper });
    
    expect(screen.getByText('Mapa de Calor do Mercado')).toBeInTheDocument();
  });

  test('renderiza os dados do mercado corretamente', async () => {
    const mockData = [
      {
        name: 'Bitcoin',
        price_change_percentage_24h: 5.5,
        market_cap: 1000000000
      }
    ];

    axios.get.mockResolvedValueOnce({ data: mockData });

    render(<MarketHeatmap />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('+5.50%')).toBeInTheDocument();
    });
  });

  test('exibe mensagem de erro quando a requisição falha', async () => {
    axios.get.mockRejectedValueOnce(new Error('Erro ao carregar dados'));

    render(<MarketHeatmap />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados do mercado')).toBeInTheDocument();
    });
  });
});