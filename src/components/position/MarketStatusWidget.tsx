import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MarketInfo {
  key: string;
  label: string;
  shortLabel: string;
  isOpen: boolean;
}

function getMarketStatus(): MarketInfo[] {
  const now = new Date();
  // Brasília = UTC-3
  const brasiliaOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const brasiliaTime = new Date(now.getTime() + (localOffset + brasiliaOffset) * 60000);
  const hour = brasiliaTime.getHours();
  
  return [
    {
      key: 'european',
      label: 'Europeu',
      shortLabel: 'EUR',
      isOpen: hour >= 4 && hour < 8,
    },
    {
      key: 'american',
      label: 'Americano', 
      shortLabel: 'USA',
      isOpen: hour >= 10 && hour < 17,
    },
    {
      key: 'asian',
      label: 'Asiático',
      shortLabel: 'ASIA',
      isOpen: hour >= 21 || hour < 0,
    },
  ];
}

interface MarketStatusWidgetProps {
  compact?: boolean;
  className?: string;
}

export function MarketStatusWidget({ compact = false, className }: MarketStatusWidgetProps) {
  const [markets, setMarkets] = useState<MarketInfo[]>(getMarketStatus);
  
  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setMarkets(getMarketStatus());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {markets.map((market) => (
        <div key={market.key} className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              market.isOpen 
                ? 'bg-success animate-pulse' 
                : 'bg-muted-foreground/40'
            )}
          />
          <span className={cn(
            'text-xs font-medium transition-colors',
            market.isOpen 
              ? 'text-foreground' 
              : 'text-muted-foreground'
          )}>
            {compact ? market.shortLabel : market.label}
          </span>
          {!compact && (
            <span className={cn(
              'text-xs',
              market.isOpen 
                ? 'text-success' 
                : 'text-muted-foreground/60'
            )}>
              {market.isOpen ? 'Aberto' : 'Fechado'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
