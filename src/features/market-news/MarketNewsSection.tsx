/**
 * Market News Section Component
 * Pure UI component - no business logic
 * 
 * Displays news that impact Bitcoin from macroeconomic perspective
 * Uses CryptoCompare free public API for real-time data
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, TrendingUp, AlertTriangle, Minus, RefreshCw, Wifi, Filter } from 'lucide-react';
import { useMarketNews } from './useMarketNews';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { ClassifiedNewsItem } from './types';

// Category filter options
type CategoryFilter = 'all' | 'regulation' | 'economy' | 'market';

const categoryFilters: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'regulation', label: 'Regulação' },
  { key: 'economy', label: 'Economia' },
  { key: 'market', label: 'Mercado' },
];

// Keywords for category classification (client-side)
const categoryKeywords: Record<Exclude<CategoryFilter, 'all'>, string[]> = {
  regulation: ['regulação', 'regulamento', 'sec', 'lei', 'legislação', 'proibição', 'aprovação', 'etf', 'compliance', 'cbdc', 'banco central', 'governo', 'tribunal', 'legal', 'ilegal', 'proibir', 'permitir', 'licença'],
  economy: ['inflação', 'juros', 'fed', 'taxa', 'dólar', 'economia', 'recessão', 'pib', 'emprego', 'cpi', 'fomc', 'powell', 'yellen', 'tesouro', 'treasury', 'bonds', 'yield', 'macro'],
  market: ['preço', 'alta', 'baixa', 'bull', 'bear', 'rally', 'correção', 'volume', 'liquidez', 'whale', 'baleia', 'exchange', 'trading', 'bitcoin', 'ethereum', 'altcoin', 'defi', 'nft'],
};

// Classify news by category based on title keywords
function classifyCategory(title: string): CategoryFilter {
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category as Exclude<CategoryFilter, 'all'>;
    }
  }
  
  return 'market'; // Default to market if no match
}

// Impact level badge colors using semantic tokens
const impactStyles = {
  high: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
    icon: TrendingUp,
    label: 'Alto Impacto',
  },
  medium: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
    icon: AlertTriangle,
    label: 'Médio Impacto',
  },
  low: {
    bg: 'bg-muted/10',
    text: 'text-muted-foreground',
    border: 'border-muted/30',
    icon: Minus,
    label: 'Baixo Impacto',
  },
};

interface NewsItemCardProps {
  news: ClassifiedNewsItem;
  index: number;
}

function NewsItemCard({ news, index }: NewsItemCardProps) {
  const style = impactStyles[news.impactLevel];
  const ImpactIcon = style.icon;
  const isHighImpact = news.impactLevel === 'high';
  
  const formattedDate = new Date(news.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleClick = () => {
    if (news.url) {
      window.open(news.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleClick}
      className={`
        group p-4 rounded-lg border transition-all cursor-pointer
        ${isHighImpact 
          ? 'bg-destructive/5 hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 ring-1 ring-destructive/10' 
          : 'bg-card/50 hover:bg-card/80 border-border/30 hover:border-primary/30'
        }
        ${news.url ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${style.bg} ${style.text} ${style.border} border
            `}>
              <ImpactIcon className="w-3 h-3" />
              {style.label}
            </span>
            {isHighImpact && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
            )}
          </div>
          
          <h3 className={`font-medium leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors ${isHighImpact ? 'text-foreground font-semibold' : 'text-foreground'}`}>
            {news.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{news.source}</span>
            <span>•</span>
            <time dateTime={news.publishedAt}>{formattedDate}</time>
          </div>
        </div>
        
        {news.url && (
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
    </motion.article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-lg border border-border/30 bg-card/50">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-3/4 mb-3" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  isFiltered?: boolean;
}

function EmptyState({ isFiltered }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      {isFiltered ? (
        <>
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">Nenhuma notícia nesta categoria</p>
          <p className="text-xs mt-1">Tente selecionar outra categoria ou "Todas"</p>
        </>
      ) : (
        <>
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma notícia relevante no momento</p>
        </>
      )}
    </div>
  );
}

interface CategoryFilterChipsProps {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}

function CategoryFilterChips({ selected, onSelect }: CategoryFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categoryFilters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${selected === key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function MarketNewsSection() {
  const { status, data, refetch, dataUpdatedAt, isFetching } = useMarketNews();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Filter news by category (client-side only)
  const filteredNews = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (categoryFilter === 'all') return data;
    
    return data.filter(news => classifyCategory(news.title) === categoryFilter);
  }, [data, categoryFilter]);

  // Error state - don't render section at all (doesn't break Home)
  if (status === 'error') {
    return null;
  }

  const lastUpdate = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const isFiltered = categoryFilter !== 'all';

  return (
    <section className="glass-morphism rounded-2xl p-6 border border-border/30 hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Newspaper className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Notícias que Impactam o Bitcoin
            </h2>
            <p className="text-sm text-muted-foreground">
              Fatores macroeconômicos e geopolíticos
            </p>
          </div>
        </div>
        
        {/* Real-time indicator and refresh */}
        <div className="flex items-center gap-2">
          {status === 'success' && (
            <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">Tempo Real</span>
            </Badge>
          )}
          {lastUpdate && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Atualizado: {lastUpdate}
            </span>
          )}
          <button
            onClick={() => refetch?.()}
            disabled={isFetching}
            className="p-2 rounded-lg hover:bg-accent/50 transition-colors disabled:opacity-50"
            title="Atualizar notícias"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category filter chips */}
      {status === 'success' && (
        <CategoryFilterChips selected={categoryFilter} onSelect={setCategoryFilter} />
      )}

      {status === 'loading' && <LoadingSkeleton />}
      
      {status === 'empty' && <EmptyState />}
      
      {status === 'success' && filteredNews.length === 0 && <EmptyState isFiltered={isFiltered} />}
      
      {status === 'success' && filteredNews.length > 0 && (
        <div className="space-y-3">
          {filteredNews.map((news, index) => (
            <NewsItemCard key={news.id} news={news} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
