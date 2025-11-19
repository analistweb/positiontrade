import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const VolumeComparisonCard = ({ totalBuyVolume, totalSellVolume }) => {
  const total = totalBuyVolume + totalSellVolume;
  const buyPercentage = (totalBuyVolume / total) * 100;
  const sellPercentage = (totalSellVolume / total) * 100;
  const netFlow = totalBuyVolume - totalSellVolume;
  const isBullish = netFlow > 0;
  
  const formatVolume = (volume) => {
    return `$${(volume / 1e9).toFixed(2)}B`;
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Fluxo Líquido de Volume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Net Flow Indicator */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isBullish ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {isBullish ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="font-bold text-xl">
              {formatVolume(Math.abs(netFlow))}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isBullish ? 'Pressão Compradora' : 'Pressão Vendedora'}
          </p>
        </div>

        {/* Volume Bars */}
        <div className="space-y-4">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-green-500 font-medium">
                <TrendingUp className="w-4 h-4" />
                Volume Compra
              </span>
              <span className="font-bold">{buyPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-8 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-end pr-3"
                initial={{ width: 0 }}
                animate={{ width: `${buyPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <span className="text-xs font-bold text-white">
                  {formatVolume(totalBuyVolume)}
                </span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-red-500 font-medium">
                <TrendingDown className="w-4 h-4" />
                Volume Venda
              </span>
              <span className="font-bold">{sellPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-8 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full flex items-center justify-end pr-3"
                initial={{ width: 0 }}
                animate={{ width: `${sellPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              >
                <span className="text-xs font-bold text-white">
                  {formatVolume(totalSellVolume)}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{formatVolume(total)}</p>
              <p className="text-xs text-muted-foreground">Volume Total</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
                {isBullish ? '+' : ''}{((netFlow / total) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Desequilíbrio</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VolumeComparisonCard;
