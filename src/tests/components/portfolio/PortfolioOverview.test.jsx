import { render, screen } from '@testing-library/react';
import PortfolioOverview from '../../../components/portfolio/PortfolioOverview';

const mockPortfolioData = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'btc',
    quantity: 1,
    current_price: 50000,
    price_change_percentage_24h: 5.5,
    image: 'bitcoin.png'
  }
];

describe('PortfolioOverview', () => {
  test('renderiza o portfólio corretamente', () => {
    render(<PortfolioOverview portfolioData={mockPortfolioData} />);

    expect(screen.getByText('Seu Portfólio')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('(BTC)')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  test('calcula o valor total do portfólio corretamente', () => {
    render(<PortfolioOverview portfolioData={mockPortfolioData} />);

    expect(screen.getByText('Total: $50,000.00')).toBeInTheDocument();
  });

  test('exibe a variação percentual corretamente', () => {
    render(<PortfolioOverview portfolioData={mockPortfolioData} />);

    expect(screen.getByText('5.50%')).toBeInTheDocument();
  });
});