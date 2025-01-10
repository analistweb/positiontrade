import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MarketSentiment from '../../../components/dashboard/MarketSentiment';
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

describe('MarketSentiment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza o estado de carregamento', () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    
    render(<MarketSentiment />, { wrapper });
    
    expect(screen.getByText('Análise de Sentimento do Mercado')).toBeInTheDocument();
  });

  test('renderiza os indicadores de sentimento corretamente', async () => {
    const mockData = {
      market_data: {
        price_change_percentage_24h: 5,
        total_volume: { usd: 1000000000 },
        market_cap_percentage: 45,
      },
      community_data: {
        twitter_followers: 1000000,
      },
    };

    axios.get.mockResolvedValueOnce({ data: mockData });

    render(<MarketSentiment />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Volume de Mercado 24h')).toBeInTheDocument();
      expect(screen.getByText('Menções em Redes Sociais')).toBeInTheDocument();
    });
  });
});