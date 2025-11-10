import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const EntityVolumeHeatmap = ({ transactions }) => {
  const maxAmount = Math.max(...transactions.map(t => t.amount));
  
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Heatmap de Entidades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {transactions.map((transaction, index) => {
            const intensity = (transaction.amount / maxAmount);
            const isBuy = transaction.type === "Compra";
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="relative overflow-hidden rounded-lg p-4 cursor-pointer transition-all"
                style={{
                  backgroundColor: isBuy 
                    ? `rgba(34, 197, 94, ${0.1 + intensity * 0.3})`
                    : `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`,
                  borderLeft: `4px solid ${isBuy ? '#22c55e' : '#ef4444'}`
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm truncate flex-1">
                    {transaction.entity}
                  </h3>
                  {isBuy ? (
                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${isBuy ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type}
                  </p>
                  <p className="text-lg font-bold">
                    ${(transaction.amount / 1e6).toFixed(2)}M
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @ ${transaction.price.toLocaleString()}
                  </p>
                </div>
                
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
                  style={{
                    background: isBuy 
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    width: `${intensity * 100}%`
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EntityVolumeHeatmap;
