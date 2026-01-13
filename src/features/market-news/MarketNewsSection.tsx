/**
 * Market News Section Component
 * Immersive editorial design with true parallax, pagination, and visual hierarchy
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Newspaper, 
  ExternalLink, 
  TrendingUp, 
  AlertTriangle, 
  Minus, 
  RefreshCw, 
  Filter,
  Zap,
  Clock,
  Globe,
  Landmark,
  BarChart3,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useMarketNews } from './useMarketNews';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { ClassifiedNewsItem } from './types';

// ============================================
// Types & Constants
// ============================================

type CategoryFilter = 'all' | 'regulation' | 'economy' | 'market';

const ITEMS_PER_PAGE = 6;

const categoryFilters: { key: CategoryFilter; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Todas', icon: Globe },
  { key: 'regulation', label: 'Regulação', icon: Landmark },
  { key: 'economy', label: 'Economia', icon: TrendingUp },
  { key: 'market', label: 'Mercado', icon: BarChart3 },
];

const categoryKeywords: Record<Exclude<CategoryFilter, 'all'>, string[]> = {
  regulation: ['regulação', 'regulamento', 'sec', 'lei', 'legislação', 'proibição', 'aprovação', 'etf', 'compliance', 'cbdc', 'banco central', 'governo', 'tribunal', 'legal', 'ilegal', 'proibir', 'permitir', 'licença'],
  economy: ['inflação', 'juros', 'fed', 'taxa', 'dólar', 'economia', 'recessão', 'pib', 'emprego', 'cpi', 'fomc', 'powell', 'yellen', 'tesouro', 'treasury', 'bonds', 'yield', 'macro'],
  market: ['preço', 'alta', 'baixa', 'bull', 'bear', 'rally', 'correção', 'volume', 'liquidez', 'whale', 'baleia', 'exchange', 'trading', 'bitcoin', 'ethereum', 'altcoin', 'defi', 'nft'],
};

function classifyCategory(title: string): CategoryFilter {
  const lowerTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category as Exclude<CategoryFilter, 'all'>;
    }
  }
  return 'market';
}

const impactStyles = {
  high: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    border: 'border-destructive/40',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.12)]',
    icon: Zap,
    label: 'Alto Impacto',
    cardBg: 'bg-gradient-to-br from-destructive/8 via-destructive/4 to-transparent',
    cardBorder: 'border-destructive/25 hover:border-destructive/50',
  },
  medium: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    border: 'border-warning/40',
    glow: '',
    icon: AlertTriangle,
    label: 'Médio Impacto',
    cardBg: 'bg-gradient-to-br from-warning/4 via-transparent to-transparent',
    cardBorder: 'border-warning/15 hover:border-warning/35',
  },
  low: {
    bg: 'bg-muted/30',
    text: 'text-muted-foreground',
    border: 'border-muted/50',
    glow: '',
    icon: Minus,
    label: 'Baixo Impacto',
    cardBg: 'bg-card/50',
    cardBorder: 'border-border/25 hover:border-border/50',
  },
};

// ============================================
// Hero Section Component
// ============================================

interface HeroSectionProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdate: string | null;
  isLive: boolean;
}

function HeroSection({ onRefresh, isRefreshing, lastUpdate, isLive }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-2xl mb-8"
    >
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Floating orbs */}
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
        animate={prefersReducedMotion ? {} : { y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 60%)',
          filter: 'blur(30px)',
        }}
        animate={prefersReducedMotion ? {} : { y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      
      {/* Content */}
      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Icon */}
            <motion.div 
              className="relative p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Newspaper className="w-8 h-8 text-white" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary animate-pulse" />
            </motion.div>
            
            <div>
              {/* Live badge */}
              {isLive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-emerald-500/20 border border-emerald-500/40 rounded-full"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-medium text-emerald-300">TEMPO REAL</span>
                </motion.div>
              )}
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-hero text-white tracking-tight">
                Notícias Cripto
              </h2>
              <p className="text-white/60 mt-2 max-w-lg">
                Fatores macroeconômicos que impactam Bitcoin e o mercado cripto
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {lastUpdate && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Clock className="w-4 h-4" />
                <span>Atualizado: {lastUpdate}</span>
              </div>
            )}
            
            <motion.button
              onClick={onRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Atualizar</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Category Filter Chips
// ============================================

interface CategoryFilterChipsProps {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
  newsCount?: Record<CategoryFilter, number>;
}

function CategoryFilterChips({ selected, onSelect, newsCount }: CategoryFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {categoryFilters.map(({ key, label, icon: Icon }) => {
        const isActive = selected === key;
        const count = newsCount?.[key] ?? 0;
        
        return (
          <motion.button
            key={key}
            onClick={() => onSelect(key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-foreground text-background shadow-md'
                : 'bg-background text-foreground-muted hover:text-foreground border border-border hover:border-foreground/20'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count > 0 && (
              <span className={`
                ml-1 px-1.5 py-0.5 rounded-md text-xs font-semibold
                ${isActive ? 'bg-background/20' : 'bg-muted'}
              `}>
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================
// News Card Component
// ============================================

interface NewsItemCardProps {
  news: ClassifiedNewsItem;
  index: number;
  featured?: boolean;
}

function NewsItemCard({ news, index, featured }: NewsItemCardProps) {
  const prefersReducedMotion = useReducedMotion();
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
    if (news.url) window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        delay: prefersReducedMotion ? 0 : index * 0.05, 
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      onClick={handleClick}
      whileHover={prefersReducedMotion ? {} : { y: -6, transition: { duration: 0.2 } }}
      className={`
        group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
        ${style.cardBg} ${style.cardBorder} ${style.glow}
        hover:shadow-xl hover:shadow-black/5
        ${featured ? 'lg:col-span-2' : ''}
      `}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/3 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* High impact indicator */}
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
            ? 'bg-destructive/10 border-destructive/30 group-hover:bg-destructive/15' 
            : 'bg-muted/20 border-border/40 group-hover:bg-primary/10 group-hover:border-primary/30'
          }
        `}>
          <CategoryIcon className={`w-5 h-5 ${isHighImpact ? 'text-destructive' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
              ${style.bg} ${style.text} ${style.border} border
            `}>
              <ImpactIcon className="w-3.5 h-3.5" />
              {style.label}
            </span>
            
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-muted/40 text-muted-foreground border border-border/20">
              {categoryFilters.find(f => f.key === category)?.label}
            </span>
            
            {isHighImpact && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className={`
            font-semibold leading-snug mb-3 line-clamp-2 transition-colors duration-200
            ${featured ? 'text-lg' : 'text-base'}
            ${isHighImpact ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground'}
            group-hover:text-primary
          `}>
            {news.title}
          </h3>
          
          {/* Summary */}
          {news.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
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
              <span className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                <span className="hidden sm:inline">Ler mais</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
        
        {news.url && (
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 group-hover:text-primary" />
        )}
      </div>
    </motion.article>
  );
}

// ============================================
// Pagination Component
// ============================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/30"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </Button>
      
      <div className="flex items-center gap-1 px-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <motion.button
            key={page}
            onClick={() => onPageChange(page)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`
              w-8 h-8 rounded-lg text-sm font-medium transition-all
              ${page === currentPage 
                ? 'bg-foreground text-background' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {page}
          </motion.button>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="gap-1"
      >
        Próxima
        <ChevronRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

// ============================================
// Loading Skeleton
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 p-10 mb-8">
        <div className="flex items-center gap-5">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
      
      {/* Filter chips */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl" />
        ))}
      </div>
      
      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-border/30 bg-card/50">
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
    </div>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  isFiltered?: boolean;
}

function EmptyState({ isFiltered }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="p-5 bg-muted/20 rounded-2xl mb-5">
        {isFiltered ? (
          <Filter className="w-12 h-12 text-muted-foreground" />
        ) : (
          <Newspaper className="w-12 h-12 text-muted-foreground" />
        )}
      </div>
      {isFiltered ? (
        <>
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma notícia nesta categoria</h3>
          <p className="text-muted-foreground max-w-sm">
            Selecione outra categoria ou clique em "Todas" para ver todas as notícias.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma notícia disponível</h3>
          <p className="text-muted-foreground max-w-sm">
            As notícias são atualizadas automaticamente a cada 5 minutos.
          </p>
        </>
      )}
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function MarketNewsSection() {
  const { status, data, refetch, dataUpdatedAt, isFetching } = useMarketNews();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filter changes
  const handleCategoryChange = (category: CategoryFilter) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  // Calculate news counts
  const newsCount = useMemo(() => {
    if (!data || data.length === 0) return { all: 0, regulation: 0, economy: 0, market: 0 };
    
    const counts = { all: data.length, regulation: 0, economy: 0, market: 0 };
    data.forEach(news => {
      const category = classifyCategory(news.title);
      if (category !== 'all') counts[category]++;
    });
    
    return counts;
  }, [data]);

  // Filter and paginate news
  const { paginatedNews, totalPages, highlightedNews } = useMemo(() => {
    if (!data || data.length === 0) return { paginatedNews: [], totalPages: 0, highlightedNews: [] };
    
    const filtered = categoryFilter === 'all' 
      ? data 
      : data.filter(news => classifyCategory(news.title) === categoryFilter);
    
    const highlighted = filtered.filter(n => n.impactLevel === 'high').slice(0, 2);
    const regular = filtered.filter(n => !highlighted.includes(n));
    
    const total = Math.ceil(regular.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = regular.slice(start, start + ITEMS_PER_PAGE);
    
    return { 
      paginatedNews: paginated, 
      totalPages: total,
      highlightedNews: currentPage === 1 ? highlighted : []
    };
  }, [data, categoryFilter, currentPage]);

  if (status === 'error') return null;

  const lastUpdate = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const isFiltered = categoryFilter !== 'all';
  const isLive = status === 'success';
  const hasNews = highlightedNews.length > 0 || paginatedNews.length > 0;

  return (
    <section className="relative">
      {/* Hero Section */}
      <HeroSection 
        onRefresh={() => refetch?.()}
        isRefreshing={isFetching}
        lastUpdate={lastUpdate}
        isLive={isLive}
      />

      {/* Loading */}
      {status === 'loading' && <LoadingSkeleton />}
      
      {/* Content */}
      {status !== 'loading' && (
        <>
          {/* Category Filters */}
          {status === 'success' && (
            <CategoryFilterChips 
              selected={categoryFilter} 
              onSelect={handleCategoryChange}
              newsCount={newsCount}
            />
          )}

          {/* Empty States */}
          {status === 'empty' && <EmptyState />}
          {status === 'success' && !hasNews && <EmptyState isFiltered={isFiltered} />}
          
          {/* News Grid */}
          {status === 'success' && hasNews && (
            <>
              {/* Highlighted News */}
              {highlightedNews.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-destructive/15 rounded-lg">
                      <Zap className="w-4 h-4 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">Em Destaque</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                      {highlightedNews.map((news, index) => (
                        <NewsItemCard key={news.id} news={news} index={index} featured />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              
              {/* Regular News */}
              {paginatedNews.length > 0 && (
                <div>
                  {highlightedNews.length > 0 && (
                    <h3 className="text-lg font-semibold mb-4">Outras Notícias</h3>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                      {paginatedNews.map((news, index) => (
                        <NewsItemCard 
                          key={news.id} 
                          news={news} 
                          index={highlightedNews.length + index} 
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              
              {/* Pagination */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              
              {/* Footer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Atualiza automaticamente a cada 5 minutos</span>
              </motion.div>
            </>
          )}
        </>
      )}
    </section>
  );
}
