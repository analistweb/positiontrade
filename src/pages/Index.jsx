import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  ArrowRight,
  Zap,
  Radio,
  RefreshCw,
  Search,
  Target,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { axiosInstance } from '@/config/api';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditorialSection } from '@/components/editorial/EditorialHero';
import { EditorialCard, EditorialCardGrid } from '@/components/editorial/EditorialCard';
import { EditorialLoading, EditorialError } from '@/components/editorial/EditorialStates';
import { ScrollProgressBar, FadeInOnScroll } from '@/components/effects';
import LiveCryptoHero from '@/components/dashboard/LiveCryptoHero';
import NewsBannerHero from '@/components/dashboard/NewsBannerHero';
import { MarketNewsSection } from '@/features/market-news';
import { MarketStatusWidget } from '@/components/position';
import { toast } from "sonner";

// Popular tickers para sugestões rápidas
const POPULAR_TICKERS = [
  { symbol: 'BTC-USD', label: 'Bitcoin', market: 'Crypto' },
  { symbol: 'ETH-USD', label: 'Ethereum', market: 'Crypto' },
  { symbol: 'PETR4.SA', label: 'Petrobras', market: 'B3' },
  { symbol: 'VALE3.SA', label: 'Vale', market: 'B3' },
  { symbol: 'AAPL', label: 'Apple', market: 'US' },
  { symbol: 'NVDA', label: 'Nvidia', market: 'US' },
];

const Index = () => {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [searchTicker, setSearchTicker] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const { data: marketOverview, isLoading, error, refetch } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: async () => {
      const [globalData, topCoins] = await Promise.all([
        axiosInstance.get('/global').catch(() => ({ data: null })),
        axiosInstance.get('/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 8,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h'
          }
        }).catch(() => ({ data: [] }))
      ]);
      return {
        global: globalData.data?.data || null,
        topCoins: topCoins.data || []
      };
    },
    refetchInterval: 60000,
    onError: () => toast.error("Erro ao carregar dados do mercado")
  });

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value?.toFixed(2)}`;
  };

  const handleSearch = useCallback((ticker) => {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (normalizedTicker) {
      navigate(`/analise-posicao?ticker=${encodeURIComponent(normalizedTicker)}`);
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchTicker);
  };

  const quickLinks = [
    { title: "Sinais de Trade", to: "/sinais-trade", icon: Radio, description: "Sinais em tempo real para BTC, ETH e outras criptomoedas" },
    { title: "Análise de Compra/Venda", to: "/analise-compra-venda", icon: TrendingUp, description: "Indicadores técnicos e volume" },
    { title: "Atividade das Baleias", to: "/posicao-carteira", icon: Wallet, description: "Acompanhe grandes investidores" },
    { title: "Análise Técnica", to: "/analise-tecnica", icon: BarChart3, description: "Ferramentas avançadas de análise" }
  ];

  if (error) {
    return <EditorialError onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgressBar />
      
      {/* POSITION ANALYZER HERO - Destaque Principal */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-background-alt">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent2/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Market Status Widget */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <MarketStatusWidget variant="compact" />
          </motion.div>

          {/* Logo e Título */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Target className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Position Trade
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto">
              Análise técnica profissional para qualquer ativo
            </p>
          </motion.div>

          {/* Search Bar Google-Style */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto mb-8"
          >
            <div 
              className={`
                relative w-full transition-all duration-300
                ${isFocused ? 'scale-[1.02]' : 'scale-100'}
              `}
            >
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Digite um ticker (ex: PETR4.SA, AAPL, BTC-USD)"
                className={`
                  w-full h-14 sm:h-16 pl-14 pr-32 rounded-full
                  bg-card/80 backdrop-blur-sm
                  border border-border/50
                  text-lg placeholder:text-muted-foreground/60
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                  shadow-sm hover:shadow-lg focus:shadow-lg
                  transition-all duration-300
                `}
                autoComplete="off"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 sm:h-12 px-6 gap-2"
                disabled={!searchTicker.trim()}
              >
                <span className="hidden sm:inline">Analisar</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.form>

          {/* Popular Tickers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
          >
            <span className="text-sm text-muted-foreground/60 mr-2 self-center">
              Populares:
            </span>
            {POPULAR_TICKERS.map((ticker, index) => (
              <motion.button
                key={ticker.symbol}
                onClick={() => handleSearch(ticker.symbol)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 hover:bg-card border border-border/50 hover:border-primary/30 transition-all duration-200 text-sm"
              >
                <span className="font-medium text-foreground">{ticker.symbol}</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-background/50">
                  {ticker.market}
                </Badge>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </motion.div>

          {/* Link para página dedicada */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <Link 
              to="/analise-posicao" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <span>Acessar análise completa</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* LIVE CRYPTO HERO */}
      {isLoading ? (
        <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-background-alt via-[hsl(220,18%,8%)] to-[hsl(220,18%,5%)]">
          <EditorialLoading title="Carregando dados ao vivo" />
        </div>
      ) : (
        <LiveCryptoHero 
          coins={marketOverview?.topCoins || []}
          globalData={marketOverview?.global}
          formatCurrency={formatCurrency}
        />
      )}

      {/* NEWS BANNER HERO */}
      <NewsBannerHero />

      {/* NEWS SECTION */}
      <section className="py-12 md:py-16 bg-background">
        <div className="editorial-container">
          <FadeInOnScroll>
            <div className="flex items-center justify-between mb-8">
              <Badge className="bg-accent2/10 text-accent2 border-accent2/20">
                <span className="w-2 h-2 rounded-full bg-accent2 animate-pulse mr-2" />
                Atualização automática
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="group">
                <RefreshCw className="w-4 h-4 mr-2 transition-transform group-hover:rotate-180" />
                Atualizar
              </Button>
            </div>
          </FadeInOnScroll>
          
          <FadeInOnScroll>
            <MarketNewsSection />
          </FadeInOnScroll>
        </div>
      </section>

      {/* Quick Links - Ferramentas */}
      <EditorialSection 
        label="Explorar" 
        title="Ferramentas de Análise"
        className="bg-background-alt"
      >
        <EditorialCardGrid columns={2}>
          {quickLinks.map((link, index) => (
            <EditorialCard
              key={link.to}
              title={link.title}
              description={link.description}
              icon={link.icon}
              to={link.to}
              delay={index * 0.1}
            />
          ))}
        </EditorialCardGrid>
      </EditorialSection>
    </div>
  );
};

export default Index;
