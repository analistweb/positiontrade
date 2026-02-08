import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AssetSearchInputProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
  currentTicker?: string;
  variant?: 'centered' | 'compact';
}

const POPULAR_TICKERS = [
  { ticker: 'BTC-USD', label: 'Bitcoin' },
  { ticker: 'ETH-USD', label: 'Ethereum' },
  { ticker: 'PETR4.SA', label: 'Petrobras' },
  { ticker: 'VALE3.SA', label: 'Vale' },
  { ticker: 'AAPL', label: 'Apple' },
  { ticker: 'NVDA', label: 'Nvidia' },
];

export function AssetSearchInput({ 
  onSearch, 
  isLoading, 
  currentTicker,
  variant = 'centered' 
}: AssetSearchInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim().toUpperCase());
    }
  };

  const handleQuickSelect = (ticker: string) => {
    setInputValue(ticker);
    onSearch(ticker);
  };

  const isCentered = variant === 'centered';

  return (
    <div className={cn('w-full', isCentered ? 'max-w-2xl mx-auto' : 'max-w-xl')}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          'relative flex items-center transition-shadow duration-200',
          isCentered 
            ? 'rounded-full border border-border/50 bg-background shadow-sm hover:shadow-lg focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/20'
            : 'rounded-full border border-border/50 bg-background/80 shadow-sm hover:shadow-md'
        )}>
          <Search className={cn(
            'absolute text-muted-foreground pointer-events-none',
            isCentered ? 'left-5 h-5 w-5' : 'left-4 h-4 w-4'
          )} />
          <input
            type="text"
            placeholder="Digite um ticker (ex: PETR4.SA, AAPL, BTC-USD)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className={cn(
              'w-full bg-transparent border-none outline-none placeholder:text-muted-foreground/60',
              isCentered 
                ? 'h-14 pl-14 pr-4 text-lg' 
                : 'h-12 pl-11 pr-4 text-base'
            )}
          />
          {(inputValue.trim() || isLoading) && (
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={cn(
                'absolute right-2 px-4 py-2 rounded-full font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isCentered ? 'text-sm' : 'text-xs'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Analisar'
              )}
            </button>
          )}
        </div>
      </form>

      {isCentered && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="text-sm text-muted-foreground">Populares:</span>
          {POPULAR_TICKERS.map((item) => (
            <Badge
              key={item.ticker}
              variant={currentTicker === item.ticker ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors text-sm px-3 py-1"
              onClick={() => handleQuickSelect(item.ticker)}
            >
              {item.ticker}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
