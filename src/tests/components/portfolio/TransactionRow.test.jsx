
import { render, screen } from '@testing-library/react';
import TransactionRow from '../../../components/portfolio/whale-transactions/TransactionRow';

const mockTransaction = {
  timestamp: new Date().toISOString(),
  type: 'Compra',
  cryptoAmount: 10,
  cryptoSymbol: 'BTC',
  volume: 500000,
  destination: 'Carteira',
  destinationAddress: '0x123...',
  smartMoneyScore: 85
};

describe('TransactionRow', () => {
  test('renderiza os detalhes da transação corretamente', () => {
    render(<TransactionRow transaction={mockTransaction} index={0} />);

    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText('10 BTC')).toBeInTheDocument();
    expect(screen.getByText('Carteira Privada')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  test('aplica classes corretas baseado no smart money score', () => {
    render(<TransactionRow transaction={mockTransaction} index={0} />);
    
    const scoreElement = screen.getByText('85/100');
    expect(scoreElement.parentElement).toHaveClass('text-green-500');
  });
});
