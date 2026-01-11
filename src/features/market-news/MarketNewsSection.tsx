/**
 * Market News Section Component
 * Pure UI component - no business logic
 * 
 * Displays news that impact Bitcoin from macroeconomic perspective
 * Uses CryptoCompare free public API for real-time data
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  ExternalLink, 
  TrendingUp, 
  AlertTriangle, 
  Minus, 
  RefreshCw, 
  Wifi, 
  Filter,
  Zap,
  Clock,
  Globe,
  Landmark,
  BarChart3,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useMarketNews } from './useMarketNews';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { ClassifiedNewsItem } from './types';

// Category filter options
type CategoryFilter = 'all' | 'regulation' | 'economy' | 'market';

const categoryFilters: { key: CategoryFilter; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Todas', icon: Globe },
  { key: 'regulation', label: 'Regulação', icon: Landmark },
  { key: 'economy', label: 'Economia', icon: TrendingUp },
  { key: 'market', label: 'Mercado', icon: BarChart3 },
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
  
  return 'market';
}

// Impact level styles using semantic tokens
const impactStyles = {
  high: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    border: 'border-destructive/40',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    icon: Zap,
    label: 'Alto Impacto',
    cardBg: 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent',
    cardBorder: 'border-destructive/30 hover:border-destructive/50',
  },
  medium: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    border: 'border-warning/40',
    glow: '',
    icon: AlertTriangle,
    label: 'Médio Impacto',
    cardBg: 'bg-gradient-to-br from-warning/5 via-transparent to-transparent',
    cardBorder: 'border-warning/20 hover:border-warning/40',
  },
  low: {
    bg: 'bg-muted/30',
    text: 'text-muted-foreground',
    border: 'border-muted/50',
    glow: '',
    icon: Minus,
    label: 'Baixo Impacto',
    cardBg: 'bg-card/50',
    cardBorder: 'border-border/30 hover:border-border/50',
  },
};

// Hero Section Component
interface HeroSectionProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdate: string | null;
  isLive: boolean;
}

function HeroSection({ onRefresh, isRefreshing, lastUpdate, isLive }: HeroSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl mb-6"
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
      
      {/* Animated glow effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative p-4 bg-primary/20 rounded-2xl backdrop-blur-sm border border-primary/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Newspaper className="w-8 h-8 text-primary" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary animate-pulse" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Últimas Notícias em Tempo Real
              </h1>
              <p className="text-muted-foreground mt-1">
                Fatores macroeconômicos que impactam o mercado cripto
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live badge */}
            {isLive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full backdrop-blur-sm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">TEMPO REAL</span>
              </motion.div>
            )}
            
            {/* Refresh button */}
            <motion.button
              onClick={onRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </motion.button>
          </div>
        </div>
        
        {/* Last update timestamp */}
        {lastUpdate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-4 text-xs text-muted-foreground"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Última atualização: {lastUpdate}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Category Filter Chips Component
interface CategoryFilterChipsProps {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
  newsCount?: Record<CategoryFilter, number>;
}

function CategoryFilterChips({ selected, onSelect, newsCount }: CategoryFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categoryFilters.map(({ key, label, icon: Icon }) => {
        const isActive = selected === key;
        const count = newsCount?.[key] ?? 0;
        
        return (
          <motion.button
            key={key}
            onClick={() => onSelect(key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-card/80 text-muted-foreground hover:text-foreground hover:bg-card border border-border/50 hover:border-primary/30'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count > 0 && (
              <span className={`
                ml-1 px-1.5 py-0.5 rounded-md text-xs font-semibold
                ${isActive ? 'bg-primary-foreground/20' : 'bg-muted/80'}
              `}>
                {count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-primary rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// News Card Component
interface NewsItemCardProps {
  news: ClassifiedNewsItem;
  index: number;
  isHighlighted?: boolean;
}

function NewsItemCard({ news, index, isHighlighted }: NewsItemCardProps) {
  const style = impactStyles[news.impactLevel];
  const ImpactIcon = style.icon;
  const isHighImpact = news.impactLevel === 'high';
  const category = classifyCategory(news.title);
  const CategoryIcon = categoryFilters.find(f => f.key === category)?.icon || Globe;
  
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={handleClick}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
        ${style.cardBg} ${style.cardBorder} ${style.glow}
        hover:shadow-xl hover:shadow-black/5
      `}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* High impact indicator bar */}
      {isHighImpact && (
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-destructive via-destructive/80 to-destructive/40 rounded-l-2xl"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        />
      )}
      
      <div className="relative flex items-start gap-4">
        {/* Category icon */}
        <div className={`
          flex-shrink-0 p-3 rounded-xl border backdrop-blur-sm transition-all duration-300
          ${isHighImpact 
            ? 'bg-destructive/10 border-destructive/30 group-hover:bg-destructive/20' 
            : 'bg-muted/30 border-border/50 group-hover:bg-primary/10 group-hover:border-primary/30'
          }
        `}>
          <CategoryIcon className={`w-5 h-5 ${isHighImpact ? 'text-destructive' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Impact badge */}
            <span className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
              ${style.bg} ${style.text} ${style.border} border
            `}>
              <ImpactIcon className="w-3.5 h-3.5" />
              {style.label}
            </span>
            
            {/* Category badge */}
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30">
              {categoryFilters.find(f => f.key === category)?.label}
            </span>
            
            {/* Pulsing dot for high impact */}
            {isHighImpact && (
              <span className="relative flex h-2.5 w-2.5 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className={`
            font-semibold leading-snug mb-3 line-clamp-2 transition-colors duration-200
            ${isHighImpact ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground'}
            group-hover:text-primary
          `}>
            {news.title}
          </h3>
          
          {/* Summary (if available) */}
          {news.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {news.summary}
            </p>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">{news.source}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <time dateTime={news.publishedAt} className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </time>
            </div>
            
            {news.url && (
              <span className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden sm:inline">Ler mais</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
        
        {/* External link indicator */}
        {news.url && (
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 group-hover:text-primary" />
        )}
      </div>
    </motion.article>
  );
}

// Highlighted News Section (for high impact news)
interface HighlightedNewsSectionProps {
  news: ClassifiedNewsItem[];
}

function HighlightedNewsSection({ news }: HighlightedNewsSectionProps) {
  if (news.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-destructive/20 rounded-lg">
          <Zap className="w-4 h-4 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Em Destaque</h2>
        <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full">
          {news.length} {news.length === 1 ? 'notícia' : 'notícias'}
        </span>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence>
          {news.map((item, index) => (
            <NewsItemCard key={item.id} news={item} index={index} isHighlighted />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 p-8 mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
      
      {/* Filter chips skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-xl" />
        ))}
      </div>
      
      {/* Cards skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-5 rounded-2xl border border-border/30 bg-card/50">
          <div className="flex gap-4">
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  isFiltered?: boolean;
}

function EmptyState({ isFiltered }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="p-4 bg-muted/30 rounded-2xl mb-4">
        {isFiltered ? (
          <Filter className="w-12 h-12 text-muted-foreground" />
        ) : (
          <Newspaper className="w-12 h-12 text-muted-foreground" />
        )}
      </div>
      {isFiltered ? (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma notícia nesta categoria</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Tente selecionar outra categoria ou clique em "Todas" para ver todas as notícias disponíveis.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma notícia no momento</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            As notícias são atualizadas automaticamente a cada 5 minutos. Clique em atualizar para verificar novas notícias.
          </p>
        </>
      )}
    </motion.div>
  );
}

// Main Component
export function MarketNewsSection() {
  const { status, data, refetch, dataUpdatedAt, isFetching } = useMarketNews();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Calculate news count per category
  const newsCount = useMemo(() => {
    if (!data || data.length === 0) return { all: 0, regulation: 0, economy: 0, market: 0 };
    
    const counts = { all: data.length, regulation: 0, economy: 0, market: 0 };
    data.forEach(news => {
      const category = classifyCategory(news.title);
      if (category !== 'all') counts[category]++;
    });
    
    return counts;
  }, [data]);

  // Filter news by category (client-side only)
  const filteredNews = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (categoryFilter === 'all') return data;
    
    return data.filter(news => classifyCategory(news.title) === categoryFilter);
  }, [data, categoryFilter]);

  // Separate high impact news for highlighting
  const { highlightedNews, regularNews } = useMemo(() => {
    const highlighted = filteredNews.filter(news => news.impactLevel === 'high');
    const regular = filteredNews.filter(news => news.impactLevel !== 'high');
    return { highlightedNews: highlighted, regularNews: regular };
  }, [filteredNews]);

  // Error state - don't render section at all (doesn't break Home)
  if (status === 'error') {
    return null;
  }

  const lastUpdate = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const isFiltered = categoryFilter !== 'all';
  const isLive = status === 'success';

  return (
    <section className="relative">
      {/* Hero Section */}
      <HeroSection 
        onRefresh={() => refetch?.()}
        isRefreshing={isFetching}
        lastUpdate={lastUpdate}
        isLive={isLive}
      />

      {/* Main content container */}
      <div className="glass-morphism rounded-2xl p-6 border border-border/30 hover:border-primary/20 transition-all">
        {/* Category Filters */}
        {status === 'success' && (
          <CategoryFilterChips 
            selected={categoryFilter} 
            onSelect={setCategoryFilter}
            newsCount={newsCount}
          />
        )}

        {/* Loading State */}
        {status === 'loading' && <LoadingSkeleton />}
        
        {/* Empty State */}
        {status === 'empty' && <EmptyState />}
        
        {/* Filtered Empty State */}
        {status === 'success' && filteredNews.length === 0 && <EmptyState isFiltered={isFiltered} />}
        
        {/* News Content */}
        {status === 'success' && filteredNews.length > 0 && (
          <>
            {/* Highlighted News (High Impact) */}
            <HighlightedNewsSection news={highlightedNews} />
            
            {/* Regular News List */}
            {regularNews.length > 0 && (
              <div>
                {highlightedNews.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Outras Notícias</h2>
                    <span className="px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full">
                      {regularNews.length}
                    </span>
                  </div>
                )}
                <div className="space-y-4">
                  <AnimatePresence>
                    {regularNews.map((news, index) => (
                      <NewsItemCard key={news.id} news={news} index={highlightedNews.length + index} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Timestamp footer */}
        {status === 'success' && lastUpdate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 pt-4 border-t border-border/30 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Última atualização: {lastUpdate}</span>
            <span className="mx-2">•</span>
            <span>Atualiza automaticamente a cada 5 minutos</span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
