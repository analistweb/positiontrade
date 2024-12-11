import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../Index';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Index Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders welcome message', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Welcome to Crypto Analytics/i)).toBeInTheDocument();
  });

  it('renders explore button', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Explore Dashboard/i)).toBeInTheDocument();
  });

  it('navigates to dashboard when explore button is clicked', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText(/Explore Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});