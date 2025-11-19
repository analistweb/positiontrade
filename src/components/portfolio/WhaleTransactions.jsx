
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { motion } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { fetchWhaleTransactions } from '@/services/marketService';
import { Skeleton } from "@/components/ui/skeleton";
import CryptoImage from '../common/CryptoImage';

const WhaleTransactions = () => {
  const { 
    data: transactions, 
    isLoading
  } = useQuery({
    queryKey: ['whaleTransactions', '7d'],
    queryFn: () => fetchWhaleTransactions('7d'),
    refetchInterval: 300000,
    staleTime: 240000,
  });

  // Analisar sentimento dos whales para BTC e ETH
  const whaleAnalysis = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { btc: null, eth: null };
    }

    const analyzeCrypto = (symbol) => {
      const cryptoTransactions = transactions.filter(t => 
        t.cryptoSymbol?.toUpperCase() === symbol
      );

      if (cryptoTransactions.length === 0) return null;

      const buyVolume = cryptoTransactions
        .filter(t => t.type === 'Compra')
        .reduce((sum, t) => sum + (t.volume || 0), 0);
      
      const sellVolume = cryptoTransactions
        .filter(t => t.type === 'Venda')
        .reduce((sum, t) => sum + (t.volume || 0), 0);

      const totalVolume = buyVolume + sellVolume;
      const buyPercentage = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;
      
      return {
        sentiment: buyPercentage >= 55 ? 'buying' : buyPercentage <= 45 ? 'selling' : 'neutral',
        buyPercentage: buyPercentage.toFixed(1),
        sellPercentage: (100 - buyPercentage).toFixed(1),
        totalVolume: totalVolume
      };
    };

    return {
      btc: analyzeCrypto('BTC'),
      eth: analyzeCrypto('ETH')
    };
  }, [transactions]);

  const CryptoSentimentCard = ({ crypto, data, name }) => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-4 p-4 sm:p-6 rounded-xl bg-card/50 border border-border/50">
          <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex items-center gap-4 p-4 sm:p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm sm:text-base font-medium text-muted-foreground">{name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Sem dados disponíveis</p>
          </div>
        </div>
      );
    }

    const isBuying = data.sentiment === 'buying';
    const isSelling = data.sentiment === 'selling';
    const isNeutral = data.sentiment === 'neutral';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl border-2 transition-all ${
          isBuying 
            ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
            : isSelling 
            ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
            : 'bg-card/50 border-border/50'
        }`}
      >
        {/* Background gradient effect */}
        <div className={`absolute inset-0 opacity-5 ${
          isBuying ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
          : isSelling ? 'bg-gradient-to-br from-red-500 to-rose-500'
          : 'bg-gradient-to-br from-primary to-primary'
        }`} />

        <div className="relative">
          <CryptoImage 
            symbol={crypto}
            className="h-12 w-12 sm:h-16 sm:w-16"
          />
        </div>

        <div className="flex-1 relative">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">{name}</p>
          <div className="flex items-center gap-2">
            {isBuying && (
              <>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                <span className="text-lg sm:text-2xl font-bold text-emerald-500">Comprando</span>
              </>
            )}
            {isSelling && (
              <>
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                <span className="text-lg sm:text-2xl font-bold text-red-500">Vendendo</span>
              </>
            )}
            {isNeutral && (
              <>
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-muted" />
                <span className="text-lg sm:text-2xl font-bold text-muted-foreground">Neutro</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isBuying && `${data.buyPercentage}% compras`}
            {isSelling && `${data.sellPercentage}% vendas`}
            {isNeutral && 'Equilíbrio entre compras e vendas'}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="shadow-lg border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Grandes Investidores
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Atividade dos whales nas últimas 24h
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <CryptoSentimentCard 
          crypto="bitcoin"
          data={whaleAnalysis.btc}
          name="Bitcoin (BTC)"
        />
        <CryptoSentimentCard 
          crypto="ethereum"
          data={whaleAnalysis.eth}
          name="Ethereum (ETH)"
        />
      </CardContent>
    </Card>
  );
};

export default WhaleTransactions;
