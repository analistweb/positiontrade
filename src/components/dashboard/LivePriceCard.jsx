import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import CryptoImage from '../common/CryptoImage';

const LivePriceCard = ({ coin, index }) => {
  const isPositive = coin.price_change_percentage_24h >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card/50 to-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <CardContent className="p-4 sm:p-5 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <CryptoImage 
                  src={coin.image} 
                  alt={coin.name}
                  symbol={coin.symbol}
                  className="w-10 h-10 sm:w-12 sm:h-12"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">{coin.symbol.toUpperCase()}</h3>
                <p className="text-xs text-muted-foreground">{coin.name}</p>
              </div>
            </div>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                ${coin.current_price.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
              </span>
              <span className="text-muted-foreground text-xs">
                Vol: ${(coin.total_volume / 1e9).toFixed(2)}B
              </span>
            </div>
            
            <div className="pt-2 border-t border-border/30">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Cap: ${(coin.market_cap / 1e9).toFixed(2)}B</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Rank #{coin.market_cap_rank}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LivePriceCard;
