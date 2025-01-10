import { render, screen } from '@testing-library/react';
import WhaleTransactions from '../../../components/portfolio/WhaleTransactions';

const mockTransactions = [
  {
    timestamp: new Date().toISOString(),
    type: 'Compra',
    cryptoAmount: 10,
    cryptoSymbol: 'BTC',
    volume: 500000,
    destination: 'Carteira',
    destinationAddress: '0x123...',
  }
];

describe('WhaleTransactions', () => {
  test('renderiza a tabela de transações corretamente', () => {
    render(<WhaleTransactions transactions={mockTransactions} />);

    expect(screen.getByText('Movimentações de Grandes Carteiras')).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText('10 BTC')).toBeInTheDocument();
  });

  test('exibe informações de destino corretamente', () => {
    render(<WhaleTransactions transactions={mockTransactions} />);

    expect(screen.getByText('Carteira Privada')).toBeInTheDocument();
  });

  test('exibe insights quando a tab correspondente é selecionada', () => {
    render(<WhaleTransactions transactions={mockTransactions} />);

    const insightsTab = screen.getByText('Insights');
    insightsTab.click();

    expect(screen.getByText('Análise de Comportamento')).toBeInTheDocument();
  });
});