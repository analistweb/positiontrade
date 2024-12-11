import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { motion } from "framer-motion";
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';
import { toast } from "sonner";

const MarketHeatmap = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['marketHeatmap'],
    queryFn: async () => {
      console.log('Fetching market heatmap data...');
      try {
        const response = await axios.get(
          `${COINGECKO_API_URL}/coins/markets`,
          {
            params: {
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: 8,
              sparkline: false,
              price_change_percentage: '24h'
            },
            headers: getHeaders()
          }
        );

        console.log('Market heatmap data received:', response.data);

        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Dados inválidos recebidos da API');
        }

        return response.data.map(coin => ({
          name: coin.name,
          change: coin.price_change_percentage_24h,
          marketCap: coin.market_cap,
          color: coin.price_change_percentage_24h >= 0 ? 'bg-green-500' : 'bg-red-500'
        }));
      } catch (error) {
        console.error('Error fetching market heatmap:', error);
        const errorMessage = error.response?.status === 429 
          ? "Limite de requisições excedido. Tente novamente em alguns minutos."
          : "Erro ao carregar dados do mercado. Tente novamente.";
        toast.error(errorMessage);
        throw error;
      }
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: 3, // Tenta 3 vezes em caso de falha
    staleTime: 20000, // Considera os dados obsoletos após 20 segundos
    cacheTime: 60000, // Mantém os dados em cache por 1 minuto
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
          <p className="text-red-500">
            {error.response?.status === 429 
              ? "Limite de requisições excedido. Tente novamente em alguns minutos."
              : "Erro ao carregar dados do mercado. Tente novamente."}
          </p>
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
          <p className="text-yellow-500">Nenhum dado disponível no momento.</p>
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