import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";

const MarketHeatmap = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['marketHeatmap'],
    queryFn: async () => {
      // Simulated data - in production, this would come from an API
      return [
        { name: 'Bitcoin', change: 5.2, marketCap: 800, color: 'bg-green-500' },
        { name: 'Ethereum', change: 3.8, marketCap: 400, color: 'bg-green-400' },
        { name: 'BNB', change: -2.1, marketCap: 200, color: 'bg-red-400' },
        { name: 'Solana', change: 8.5, marketCap: 150, color: 'bg-green-600' },
        { name: 'Cardano', change: -1.5, marketCap: 100, color: 'bg-red-300' },
        { name: 'XRP', change: 1.2, marketCap: 90, color: 'bg-green-300' },
        { name: 'Dogecoin', change: -3.5, marketCap: 80, color: 'bg-red-500' },
        { name: 'Polkadot', change: 2.8, marketCap: 70, color: 'bg-green-400' },
      ];
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
        <CardHeader>
          <CardTitle>Mapa de Calor do Mercado</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
      <CardHeader>
        <CardTitle>Mapa de Calor do Mercado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {data.map((coin, index) => (
            <motion.div
              key={coin.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${coin.color} p-4 rounded-lg cursor-pointer transition-transform hover:scale-105`}
              style={{
                width: `${Math.max(100, (coin.marketCap / 800) * 100)}%`,
                minHeight: '100px'
              }}
            >
              <h3 className="font-bold text-white">{coin.name}</h3>
              <p className={`text-white text-lg font-semibold ${coin.change >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                {coin.change >= 0 ? '+' : ''}{coin.change}%
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketHeatmap;