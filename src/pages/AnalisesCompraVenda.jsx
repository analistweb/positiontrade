import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import RSIRecommendation from '@/components/market/RSIRecommendation';
import { RSI } from 'technicalindicators';
import { fetchMarketData, fetchTopCoins } from '../services/marketService';
import VolumeChart from '../components/market/VolumeChart';
import MarketStats from '../components/market/MarketStats';
import EMAAnalysis from '../components/market/EMAAnalysis';
import { API_CONFIG } from '@/config/api';

const AnalisesCompraVenda = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(90);
  const [minVolume, setMinVolume] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(50);

  const { data: marketData, isLoading: marketLoading, error: marketError } = useQuery({
    queryKey: ['marketData', selectedCoin, selectedDays],
    queryFn: () => fetchMarketData(selectedCoin, selectedDays),
    refetchInterval: API_CONFIG.REFETCH_INTERVAL,
    retry: API_CONFIG.RETRY_COUNT,
    staleTime: API_CONFIG.STALE_TIME,
    cacheTime: API_CONFIG.CACHE_TIME,
    onError: (error) => {
      console.error('Market data fetch error:', error);
      toast.error(`Erro ao carregar dados de mercado: ${error.message}`);
    }
  });

  const { data: topCoins, isLoading: topCoinsLoading, error: topCoinsError } = useQuery({
    queryKey: ['topCoins'],
    queryFn: fetchTopCoins,
    refetchInterval: API_CONFIG.REFETCH_INTERVAL,
    retry: API_CONFIG.RETRY_COUNT,
    staleTime: API_CONFIG.STALE_TIME,
    cacheTime: API_CONFIG.CACHE_TIME,
    onError: (error) => {
      console.error('Top coins fetch error:', error);
      toast.error(`Erro ao carregar top moedas: ${error.message}`);
    }
  });

  React.useEffect(() => {
    if (marketData?.prices && Array.isArray(marketData.prices) && marketData.prices.length > 0) {
      const prices = marketData.prices.map(price => price[1]);
      const rsiValues = RSI.calculate({ values: prices, period: 14 });
      setCurrentRSI(rsiValues[rsiValues.length - 1] || 50);
    }
  }, [marketData]);

  if (marketLoading || topCoinsLoading) {
    return (
      <div className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <LoadingSpinner />
        </motion.div>
      </div>
    );
  }

  if (marketError || topCoinsError) {
    return (
      <div className="container mx-auto p-4">
        <ErrorDisplay 
          title="Erro ao carregar dados" 
          message={(marketError || topCoinsError)?.message} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-6">Análise de Compra e Venda</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <Label htmlFor="coin-select">Criptomoeda</Label>
              <Select onValueChange={setSelectedCoin} defaultValue={selectedCoin}>
                <SelectTrigger id="coin-select" className="w-full">
                  <SelectValue placeholder="Selecione uma criptomoeda" />
                </SelectTrigger>
                <SelectContent>
                  {topCoins?.map(coin => (
                    <SelectItem key={coin.id} value={coin.id}>
                      {coin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
            
            <Card className="p-4">
              <Label htmlFor="days-select">Período de Análise</Label>
              <Select 
                onValueChange={(value) => setSelectedDays(Number(value))} 
                defaultValue={selectedDays.toString()}
              >
                <SelectTrigger id="days-select" className="w-full">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="180">180 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            <Card className="p-4">
              <Label htmlFor="min-volume">Volume Mínimo (USD)</Label>
              <Input
                id="min-volume"
                type="number"
                value={minVolume}
                onChange={(e) => setMinVolume(Number(e.target.value))}
                placeholder="Digite o volume mínimo"
                className="w-full"
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Volume de Negociação</CardTitle>
                </CardHeader>
                <CardContent>
                  <VolumeChart marketData={marketData} minVolume={minVolume} />
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <EMAAnalysis marketData={marketData} coin={selectedCoin} />
              <RSIRecommendation rsiValue={currentRSI} />
              <MarketStats marketData={marketData} />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AnalisesCompraVenda;