import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AssetSearchInputProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
  currentTicker?: string;
}

const POPULAR_TICKERS = [
  { ticker: 'BTC-USD', label: 'Bitcoin' },
  { ticker: 'ETH-USD', label: 'Ethereum' },
  { ticker: 'PETR4.SA', label: 'Petrobras' },
  { ticker: 'VALE3.SA', label: 'Vale' },
  { ticker: 'AAPL', label: 'Apple' },
  { ticker: 'NVDA', label: 'Nvidia' },
];

export function AssetSearchInput({ onSearch, isLoading, currentTicker }: AssetSearchInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleQuickSelect = (ticker: string) => {
    setInputValue(ticker);
    onSearch(ticker);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Digite o ticker (ex: PETR4.SA, AAPL, BTC-USD)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-10 h-12 text-lg bg-background/50 border-border/50 focus:border-primary"
            disabled={isLoading}
          />
        </div>
        <Button 
          type="submit" 
          size="lg"
          disabled={isLoading || !inputValue.trim()}
          className="px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando
            </>
          ) : (
            'Analisar'
          )}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Populares:</span>
        {POPULAR_TICKERS.map((item) => (
          <Badge
            key={item.ticker}
            variant={currentTicker === item.ticker ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => handleQuickSelect(item.ticker)}
          >
            {item.ticker}
          </Badge>
        ))}
      </div>
    </div>
  );
}
