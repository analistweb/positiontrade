import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CBBIIndicator from '../../../components/dashboard/CBBIIndicator';
import { vi } from 'vitest';

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

describe('CBBIIndicator', () => {
  test('renderiza o indicador CBBI corretamente', async () => {
    render(<CBBIIndicator />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Índice CBBI')).toBeInTheDocument();
      expect(screen.getByText(/Pontuação CBBI/)).toBeInTheDocument();
    });
  });

  test('exibe informações detalhadas do CBBI', async () => {
    render(<CBBIIndicator />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Confiança')).toBeInTheDocument();
      expect(screen.getByText('Fase do Mercado')).toBeInTheDocument();
    });
  });
});