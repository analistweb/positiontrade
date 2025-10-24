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
  AlertCircle
} from "lucide-react";
import { axiosInstance } from '@/config/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
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
          {/* Global Market Stats */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
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
                    <motion.div
                      key={coin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-morphism p-4 rounded-xl card-hover"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                          <div>
                            <h3 className="font-semibold text-white">{coin.name}</h3>
                            <p className="text-xs text-gray-400 uppercase">{coin.symbol}</p>
                          </div>
                        </div>
                        {coin.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold gradient-text">
                          {formatCurrency(coin.current_price)}
                        </p>
                        <p className={`text-sm font-medium ${
                          coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercentage(coin.price_change_percentage_24h)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Cap: {formatCurrency(coin.market_cap)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <Card className="glass-morphism border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold neon-glow">Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickLinks.map((link, index) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={link.to}>
                        <Card className="glass-morphism border-0 card-hover cursor-pointer h-full">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-xl bg-primary/10">
                                <link.icon className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1">{link.title}</h3>
                                <p className="text-sm text-gray-400">{link.description}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400 mt-1" />
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