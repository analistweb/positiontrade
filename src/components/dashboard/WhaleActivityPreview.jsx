import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Waves, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchWhaleTransactions } from '@/services/marketService';
import { LoadingSpinner } from '../common/LoadingSpinner';

const WhaleActivityPreview = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['whaleTransactionsPreview', '24h'],
    queryFn: () => fetchWhaleTransactions('24h'),
    refetchInterval: 300000,
    staleTime: 240000,
  });

  const getWhaleMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return { buyVolume: 0, sellVolume: 0, netFlow: 0, trend: 'neutral' };
    }

    const buyVolume = transactions
      .filter(t => t.type === 'Compra')
      .reduce((sum, t) => sum + (t.volume || 0), 0);

    const sellVolume = transactions
      .filter(t => t.type === 'Venda')
      .reduce((sum, t) => sum + (t.volume || 0), 0);

    const netFlow = buyVolume - sellVolume;
    const trend = netFlow > 0 ? 'bullish' : netFlow < 0 ? 'bearish' : 'neutral';

    return { buyVolume, sellVolume, netFlow, trend };
  };

  if (isLoading) {
    return (
      <Card className="glass-morphism border-0">
        <CardContent className="p-6">
          <LoadingSpinner text="Carregando atividade..." />
        </CardContent>
      </Card>
    );
  }

  const metrics = getWhaleMetrics();
  const formatVolume = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${(value / 1e3).toFixed(2)}K`;
  };

  return (
    <Card className="glass-morphism border-0 card-hover h-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-500/10">
            <Waves className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Atividade das Baleias</h3>
            <p className="text-xs text-gray-400">Últimas 24 horas</p>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="mb-6">
          <div className={`flex items-center justify-center gap-2 p-4 rounded-xl ${
            metrics.trend === 'bullish' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : metrics.trend === 'bearish'
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-gray-500/10 border border-gray-500/20'
          }`}>
            {metrics.trend === 'bullish' ? (
              <>
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="text-green-500 font-semibold">Comprando</span>
              </>
            ) : metrics.trend === 'bearish' ? (
              <>
                <TrendingDown className="w-6 h-6 text-red-500" />
                <span className="text-red-500 font-semibold">Vendendo</span>
              </>
            ) : (
              <span className="text-gray-400 font-semibold">Neutro</span>
            )}
          </div>
        </div>

        {/* Volumes */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Volume de Compra</span>
            <span className="text-green-400 font-semibold">{formatVolume(metrics.buyVolume)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Volume de Venda</span>
            <span className="text-red-400 font-semibold">{formatVolume(metrics.sellVolume)}</span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Fluxo Líquido</span>
            <span className={`font-bold ${
              metrics.netFlow > 0 ? 'text-green-400' : metrics.netFlow < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {metrics.netFlow > 0 ? '+' : ''}{formatVolume(Math.abs(metrics.netFlow))}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <Link to="/posicao-carteira" className="block">
          <Button className="w-full" variant="outline">
            Ver Detalhes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default WhaleActivityPreview;
