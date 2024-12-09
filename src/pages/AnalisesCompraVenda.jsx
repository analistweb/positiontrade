import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { fetchTopCoins } from '../services/marketService';
import { useMarketData } from '@/features/market-analysis/hooks/useMarketData';
import { calculateRSI } from '@/features/market-analysis/utils/technicalAnalysis';

import CoinSelector from '@/features/market-analysis/components/CoinSelector';
import PeriodSelector from '@/features/market-analysis/components/PeriodSelector';
import RSIAnalysis from '@/features/market-analysis/components/RSIAnalysis';
import VolumeAnalysis from '@/features/market-analysis/components/VolumeAnalysis';
import EMAAnalysis from '@/components/market/EMAAnalysis';

const AnalisesCompraVenda = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(90);
  const [minVolume, setMinVolume] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(50);

  const { data: marketData, isLoading, error, dataUpdatedAt } = useMarketData(selectedCoin, selectedDays);
  
  const { data: topCoins } = useQuery({
    queryKey: ['topCoins'],
    queryFn: fetchTopCoins,
    refetchInterval: 300000
  });

  useEffect(() => {
    if (marketData?.prices) {
      const rsiValue = calculateRSI(marketData.prices);
      setCurrentRSI(rsiValue);
    }
  }, [marketData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Análise de Compra e Venda</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>Atualizado: {new Date(dataUpdatedAt).toLocaleTimeString()}</span>
            <span className="text-xs">(atualiza a cada 5 minutos)</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <CoinSelector 
            selectedCoin={selectedCoin}
            onCoinChange={setSelectedCoin}
            coins={topCoins}
          />
          
          <PeriodSelector 
            selectedDays={selectedDays}
            onDaysChange={setSelectedDays}
          />

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
            <VolumeAnalysis marketData={marketData} minVolume={minVolume} />
          </motion.div>
          
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <EMAAnalysis marketData={marketData} coin={selectedCoin} />
            <RSIAnalysis rsiValue={currentRSI} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalisesCompraVenda;