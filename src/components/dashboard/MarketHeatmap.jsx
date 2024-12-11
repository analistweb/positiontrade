import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { toast } from "sonner";
import { fetchMarketHeatmapData } from '@/services/marketHeatmapService';
import { API_CONFIG, ERROR_MESSAGES } from '@/config/constants';

const MarketHeatmap = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['marketHeatmap'],
    queryFn: fetchMarketHeatmapData,
    refetchInterval: API_CONFIG.REFETCH_INTERVAL,
    retry: API_CONFIG.RETRY_COUNT,
    staleTime: API_CONFIG.STALE_TIME,
    cacheTime: API_CONFIG.CACHE_TIME,
    onError: (error) => {
      toast.error(error.message);
    }
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

  if (error) {
    return (
      <Card className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
        <CardHeader>
          <CardTitle>Mapa de Calor do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
        <CardHeader>
          <CardTitle>Mapa de Calor do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-500">{ERROR_MESSAGES.NO_DATA}</p>
        </CardContent>
      </Card>
    );
  }

  const maxMarketCap = Math.max(...data.map(coin => coin.marketCap));

  return (
    <Card className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-none">
      <CardHeader>
        <CardTitle>Mapa de Calor do Mercado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.map((coin, index) => (
            <motion.div
              key={coin.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${coin.color} p-4 rounded-lg cursor-pointer transition-transform hover:scale-105`}
              style={{
                width: `${Math.max(100, (coin.marketCap / maxMarketCap) * 100)}%`,
                minHeight: '100px'
              }}
            >
              <h3 className="font-bold text-white">{coin.name}</h3>
              <p className={`text-white text-lg font-semibold ${coin.change >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketHeatmap;