import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Wallet, 
  ArrowRight,
  DollarSign,
  Globe,
  AlertCircle,
  Zap
} from "lucide-react";
import { axiosInstance } from '@/config/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import LivePriceCard from '../components/dashboard/LivePriceCard';
import FearGreedIndex from '../components/dashboard/FearGreedIndex';
import WhaleActivityPreview from '../components/dashboard/WhaleActivityPreview';
import { MarketNewsSection } from '../features/market-news';
import { toast } from "sonner";

const Index = () => {
  const { data: marketOverview, isLoading } = useQuery({
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
    onError: () => {
      toast.error("Erro ao carregar dados do mercado");
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value?.toFixed(2)}`;
  };

  const formatPercentage = (value) => {
    if (!value) return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const quickLinks = [
    { title: "Análise de Compra/Venda", to: "/analise-compra-venda", icon: TrendingUp, description: "Indicadores técnicos e volume" },
    { title: "Estratégia ETHUSDT", to: "/estrategia-eth", icon: Zap, description: "Trading com Didi + DMI (15min)" },
    { title: "Carteira e Movimentações", to: "/posicao-carteira", icon: Wallet, description: "Acompanhe grandes investidores" },
    { title: "Análise Técnica", to: "/analise-tecnica", icon: BarChart3, description: "Ferramentas avançadas de análise" }
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen animated-bg p-6 text-white"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="mb-8 glass-morphism p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-2">
              Análise de Criptomoedas
            </h1>
            <p className="text-gray-400 text-lg">
              Análise em tempo real do mercado com tecnologia avançada
            </p>
          </div>
          <DataSourceBadge isRealData={true} />
        </div>
      </motion.div>

      {/* Market Stats */}
      {isLoading ? (
        <LoadingSpinner text="Carregando dados do mercado..." />
      ) : (
        <>
          {/* Global Market Stats + Fear & Greed + Whale Activity */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="glass-morphism border-0 card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Cap. de Mercado Total</CardTitle>
                  <Globe className="w-4 h-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold gradient-text">
                    {formatCurrency(marketOverview?.global?.total_market_cap?.usd)}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Volume 24h: {formatCurrency(marketOverview?.global?.total_volume?.usd)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-morphism border-0 card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Dominância BTC</CardTitle>
                  <DollarSign className="w-4 h-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold gradient-text">
                    {marketOverview?.global?.market_cap_percentage?.btc?.toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    ETH: {marketOverview?.global?.market_cap_percentage?.eth?.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-morphism border-0 card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Mercados Ativos</CardTitle>
                  <Activity className="w-4 h-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold gradient-text">
                    {marketOverview?.global?.active_cryptocurrencies?.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {marketOverview?.global?.markets?.toLocaleString()} exchanges
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <FearGreedIndex />
            </motion.div>

            <motion.div variants={itemVariants}>
              <WhaleActivityPreview />
            </motion.div>
          </motion.div>

          {/* Top Cryptocurrencies */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="glass-morphism border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-semibold neon-glow">Top Criptomoedas</CardTitle>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Ao Vivo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketOverview?.topCoins?.map((coin, index) => (
                    <LivePriceCard key={coin.id} coin={coin} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Market News Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <MarketNewsSection />
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <Card className="glass-morphism border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold neon-glow">Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickLinks.map((link, index) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={link.to} className="block h-full">
                        <Card className="glass-morphism border-0 card-hover cursor-pointer h-full">
                          <CardContent className="p-6 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                                <link.icon className="w-6 h-6 text-primary" />
                              </div>
                              <h3 className="font-semibold text-white text-base">{link.title}</h3>
                            </div>
                            <p className="text-sm text-gray-400 flex-grow">{link.description}</p>
                            <div className="flex justify-end mt-4">
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Alert */}
          <motion.div variants={itemVariants} className="mt-8">
            <Card className="glass-morphism border-0 border-l-4 border-l-blue-400">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-2">Dados em Tempo Real</h3>
                    <p className="text-sm text-gray-400">
                      Todos os dados exibidos são obtidos em tempo real através da API CoinGecko. 
                      As informações são atualizadas automaticamente a cada minuto para garantir precisão nas suas análises.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Index;