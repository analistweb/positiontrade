
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { z } from 'zod';
import RSIRecommendation from '@/components/market/RSIRecommendation';
import RSIFallback from '@/components/market/RSIFallback';
import { RSI } from 'technicalindicators';
import { fetchMarketData, fetchTopCoins } from '../services/marketService';
import MarketStats from '../components/market/MarketStats';
import EMAAnalysis from '../components/market/EMAAnalysis';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import AdvancedVolumeChart from '../components/market/AdvancedVolumeChart';
import TechnicalGaugeGrid from '../components/market/TechnicalGaugeGrid';

// Schema de validação para volume mínimo
const volumeSchema = z.number()
  .min(0, "Volume não pode ser negativo")
  .max(1e12, "Volume muito grande (máx: 1 trilhão)")
  .finite("Valor deve ser um número finito")
  .nonnegative("Volume não pode ser negativo");

const AnalisesCompraVenda = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(90);
  const [minVolume, setMinVolume] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(50);

  // Handler com validação para volume mínimo
  const handleVolumeChange = useCallback((e) => {
    const value = e.target.value;
    
    // Permitir campo vazio
    if (value === '' || value === null) {
      setMinVolume(0);
      return;
    }
    
    // Validar com Zod
    const parsed = volumeSchema.safeParse(Number(value));
    
    if (parsed.success) {
      setMinVolume(parsed.data);
    } else {
      const errorMsg = parsed.error.issues[0].message;
      toast.error(errorMsg);
    }
  }, []);

  const { 
    data: marketData, 
    isLoading, 
    error,
    refetch: refetchMarketData
  } = useQuery({
    queryKey: ['marketData', selectedCoin, selectedDays],
    queryFn: () => fetchMarketData(selectedCoin, selectedDays),
    refetchInterval: 300000,
    retry: 3,
    onError: (error) => {
      toast.error(`Erro ao buscar dados: ${error.message}`);
    }
  });

  const { 
    data: topCoins,
    isLoading: isLoadingCoins,
    error: coinsError,
    refetch: refetchCoins
  } = useQuery({
    queryKey: ['topCoins'],
    queryFn: fetchTopCoins,
    refetchInterval: 300000,
    retry: 3
  });

  React.useEffect(() => {
    if (marketData?.prices && marketData.prices.length > 0) {
      const prices = marketData.prices.map(price => price[1]);
      try {
        const rsiValues = RSI.calculate({ values: prices, period: 14 });
        if (rsiValues && rsiValues.length > 0) {
          setCurrentRSI(rsiValues[rsiValues.length - 1]);
        }
      } catch (err) {
        console.error("Error calculating RSI:", err);
      }
    }
  }, [marketData]);

  const handleRefresh = useCallback(() => {
    refetchMarketData();
    refetchCoins();
    toast.success("Recarregando dados...");
  }, [refetchMarketData, refetchCoins]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </motion.div>
      );
    }

    if (error) {
      return (
        <ErrorDisplay
          title="Erro ao carregar dados"
          message={error.message}
          onRetry={handleRefresh}
        />
      );
    }

    const hasRsiData = marketData?.prices && marketData.prices.length > 14;

    return (
      <>
        <TechnicalGaugeGrid 
          rsi={currentRSI}
          mma200Ratio={1.1}
          volumeChange={12}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AdvancedVolumeChart data={marketData} />
          </motion.div>
          
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <EMAAnalysis 
              marketData={marketData} 
              coin={selectedCoin} 
            />
            {hasRsiData ? (
              <RSIRecommendation rsiValue={currentRSI} />
            ) : (
              <RSIFallback onRetry={handleRefresh} />
            )}
            <MarketStats marketData={marketData} />
          </motion.div>
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Análise de Compra e Venda</h1>
            <DataSourceBadge isRealData={true} size="md" />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <Label htmlFor="coin-select">Criptomoeda</Label>
            <Select 
              onValueChange={setSelectedCoin} 
              defaultValue={selectedCoin}
              disabled={isLoadingCoins}
            >
              <SelectTrigger id="coin-select" className="w-full">
                <SelectValue placeholder="Selecione uma criptomoeda" />
              </SelectTrigger>
              <SelectContent>
                {!topCoins || topCoins.length === 0 ? (
                  <SelectItem value="bitcoin">Bitcoin</SelectItem>
                ) : (
                  topCoins.map(coin => (
                    <SelectItem key={coin.id} value={coin.id}>
                      {coin.name}
                    </SelectItem>
                  ))
                )}
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
                <SelectItem value="30">30 dias</SelectItem>
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
              min="0"
              max="1000000000000"
              step="1000"
              value={minVolume}
              onChange={handleVolumeChange}
              placeholder="Digite o volume mínimo"
              className="w-full"
            />
          </Card>
        </div>

        {renderContent()}
      </motion.div>
    </div>
  );
};

export default AnalisesCompraVenda;
