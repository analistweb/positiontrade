import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Wallet, 
  ArrowRight,
  Globe,
  Zap,
  Radio,
  RefreshCw
} from "lucide-react";
import { axiosInstance } from '@/config/api';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditorialHero, EditorialSection } from '@/components/editorial/EditorialHero';
import { EditorialCard, EditorialCardGrid } from '@/components/editorial/EditorialCard';
import { EditorialLoading, EditorialError } from '@/components/editorial/EditorialStates';
import LivePriceCard from '@/components/dashboard/LivePriceCard';
import FearGreedIndex from '@/components/dashboard/FearGreedIndex';
import WhaleActivityPreview from '@/components/dashboard/WhaleActivityPreview';
import { MarketNewsSection } from '@/features/market-news';
import { toast } from "sonner";

const Index = () => {
  const { data: marketOverview, isLoading, error, refetch } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: async () => {
      const [globalData, topCoins] = await Promise.all([
        axiosInstance.get('/global').catch(() => ({ data: null })),
        axiosInstance.get('/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 6,
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <EditorialHero
        label="Análise em Tempo Real"
        title="Inteligência de Mercado para Criptomoedas"
        description="Dados ao vivo, indicadores técnicos avançados e monitoramento de baleias para decisões mais informadas."
        size="large"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/sinais-trade">
              <Radio className="w-4 h-4 mr-2" />
              Ver Sinais ao Vivo
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/analise-compra-venda">
              Análise de Mercado
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </EditorialHero>

      {isLoading ? (
        <div className="editorial-container py-16">
          <EditorialLoading title="Carregando dados do mercado" />
        </div>
      ) : (
        <>
          {/* Market Stats */}
          <EditorialSection label="Visão Geral" title="Mercado Global">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              {/* Market Cap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="metric-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-subtle">Cap. de Mercado</span>
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <p className="metric-value">{formatCurrency(marketOverview?.global?.total_market_cap?.usd)}</p>
                <p className="text-xs text-foreground-subtle mt-1">
                  Volume 24h: {formatCurrency(marketOverview?.global?.total_volume?.usd)}
                </p>
              </motion.div>

              {/* BTC Dominance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="metric-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-subtle">Dominância BTC</span>
                  <Badge variant="outline" className="text-xs">BTC</Badge>
                </div>
                <p className="metric-value">{marketOverview?.global?.market_cap_percentage?.btc?.toFixed(1)}%</p>
                <p className="text-xs text-foreground-subtle mt-1">
                  ETH: {marketOverview?.global?.market_cap_percentage?.eth?.toFixed(1)}%
                </p>
              </motion.div>

              {/* Active Markets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="metric-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-subtle">Mercados</span>
                  <Activity className="w-4 h-4 text-success" />
                </div>
                <p className="metric-value">{marketOverview?.global?.active_cryptocurrencies?.toLocaleString()}</p>
                <p className="text-xs text-foreground-subtle mt-1">
                  {marketOverview?.global?.markets?.toLocaleString()} exchanges
                </p>
              </motion.div>

              {/* Fear & Greed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <FearGreedIndex />
              </motion.div>

              {/* Whale Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <WhaleActivityPreview />
              </motion.div>
            </div>
          </EditorialSection>

          {/* Top Cryptocurrencies */}
          <EditorialSection 
            label="Ao Vivo" 
            title="Principais Criptomoedas"
            className="bg-background-alt"
          >
            <div className="flex items-center justify-between mb-6">
              <Badge className="bg-success/10 text-success border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-2" />
                Atualização automática
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketOverview?.topCoins?.map((coin, index) => (
                <LivePriceCard key={coin.id} coin={coin} index={index} />
              ))}
            </div>
          </EditorialSection>

          {/* News Section */}
          <EditorialSection label="Notícias" title="Últimas Atualizações">
            <MarketNewsSection />
          </EditorialSection>

          {/* Quick Links */}
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
        </>
      )}
    </div>
  );
};

export default Index;
