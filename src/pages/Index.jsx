import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from "framer-motion";
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  ArrowRight,
  Zap,
  Radio,
  RefreshCw
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
import { toast } from "sonner";

const Index = () => {
  const prefersReducedMotion = useReducedMotion();
  
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

  const quickLinks = [
    { title: "Sinais de Trade", to: "/sinais-trade", icon: Radio, description: "Sinais em tempo real para BTC, ETH e outras criptomoedas" },
    { title: "Análise de Compra/Venda", to: "/analise-compra-venda", icon: TrendingUp, description: "Indicadores técnicos e volume" },
    { title: "Estratégia ETHUSDT", to: "/estrategia-eth", icon: Zap, description: "Trading com Didi + DMI (15min)" },
    { title: "Atividade das Baleias", to: "/posicao-carteira", icon: Wallet, description: "Acompanhe grandes investidores" },
    { title: "Análise Técnica", to: "/analise-tecnica", icon: BarChart3, description: "Ferramentas avançadas de análise" }
  ];

  if (error) {
    return <EditorialError onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />
      
      {/* LIVE CRYPTO HERO - Principal */}
      {isLoading ? (
        <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-background via-[hsl(220,18%,8%)] to-[hsl(220,18%,5%)]">
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
        <EditorialCardGrid columns={3}>
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
