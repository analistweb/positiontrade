import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ExternalLink, Waves } from 'lucide-react';
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import CryptoImage from '../common/CryptoImage';
import { Badge } from "@/components/ui/badge";

const TopWhaleMovements = ({ transactions, isLoading }) => {
  const topMovements = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Pegar as 10 maiores transações
    return [...transactions]
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);
  }, [transactions]);

  const formatVolume = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${(value / 1e3).toFixed(2)}K`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const txTime = new Date(timestamp);
    const diffMs = now - txTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Waves className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Maiores Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (topMovements.length === 0) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Waves className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Maiores Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p>Sem movimentações disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Waves className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Maiores Movimentações
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Top 10 transações por volume
        </p>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-2">
        {topMovements.map((transaction, index) => {
          const isBuy = transaction.type === 'Compra';
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-lg p-3 sm:p-4 border-l-4 transition-all hover:shadow-md ${
                isBuy 
                  ? 'bg-emerald-500/5 border-emerald-500 hover:bg-emerald-500/10' 
                  : 'bg-red-500/5 border-red-500 hover:bg-red-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Crypto Icon */}
                <div className="flex-shrink-0">
                  <CryptoImage 
                    symbol={transaction.cryptoSymbol}
                    className="h-10 w-10 sm:h-12 sm:w-12"
                  />
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
                      {transaction.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(transaction.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-lg sm:text-xl font-bold">
                      {formatVolume(transaction.volume)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {transaction.cryptoAmount?.toFixed(4)} {transaction.cryptoSymbol}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>@ ${transaction.price?.toLocaleString()}</span>
                    {transaction.exchange && (
                      <>
                        <span>•</span>
                        <span>{transaction.exchange}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Icon */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  {isBuy ? (
                    <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 text-red-500" />
                  )}
                  
                  {transaction.blockExplorer && (
                    <a
                      href={transaction.blockExplorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Ver no explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Smart Money Score */}
              {transaction.smartMoneyScore && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Smart Money Score</span>
                    <span className="font-semibold">{transaction.smartMoneyScore}/100</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        transaction.smartMoneyScore >= 80 ? 'bg-emerald-500' :
                        transaction.smartMoneyScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${transaction.smartMoneyScore}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TopWhaleMovements;
