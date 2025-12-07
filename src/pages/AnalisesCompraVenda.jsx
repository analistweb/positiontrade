import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart3, TrendingUp, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
import StrategyEducation from '../components/buysell/StrategyEducation';
import MarketPulse from '../components/buysell/MarketPulse';
import ActionableInsights from '../components/buysell/ActionableInsights';

const AnalisesCompraVenda = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(90);
  const [currentRSI, setCurrentRSI] = useState(50);

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
    refetch: refetchCoins
  } = useQuery({
    queryKey: ['topCoins'],
    queryFn: fetchTopCoins,
    refetchInterval: 300000,
    retry: 3
  });

  // Calculate RSI and other metrics
  const calculatedMetrics = useMemo(() => {
    if (!marketData?.prices || marketData.prices.length < 15) {
      return { rsi: 50, priceChange: 0, volumeChange: 0 };
    }
    
    const prices = marketData.prices.map(price => price[1]);
    let rsi = 50;
    
    try {
      const rsiValues = RSI.calculate({ values: prices, period: 14 });
      if (rsiValues && rsiValues.length > 0) {
        rsi = rsiValues[rsiValues.length - 1];
      }
    } catch (err) {
      console.error("Error calculating RSI:", err);
    }

    // Calculate price change
    const currentPrice = prices[prices.length - 1];
    const priceYesterday = prices[prices.length - 2] || currentPrice;
    const priceChange = ((currentPrice - priceYesterday) / priceYesterday) * 100;

    // Calculate volume change
    let volumeChange = 0;
    if (marketData.total_volumes && marketData.total_volumes.length >= 2) {
      const currentVol = marketData.total_volumes[marketData.total_volumes.length - 1][1];
      const prevVol = marketData.total_volumes[marketData.total_volumes.length - 2][1];
      volumeChange = ((currentVol - prevVol) / prevVol) * 100;
    }

    return { rsi, priceChange, volumeChange };
  }, [marketData]);

  React.useEffect(() => {
    setCurrentRSI(calculatedMetrics.rsi);
  }, [calculatedMetrics.rsi]);

  const handleRefresh = useCallback(() => {
    refetchMarketData();
    refetchCoins();
    toast.success("Recarregando dados...");
  }, [refetchMarketData, refetchCoins]);

  const selectedCoinData = topCoins?.find(c => c.id === selectedCoin);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando análise de mercado...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <ErrorDisplay
          title="Erro ao carregar dados"
          message={error.message}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  const hasRsiData = marketData?.prices && marketData.prices.length > 14;

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <BarChart3 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Análise de Compra e Venda
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Identifique os melhores momentos para comprar ou vender usando indicadores técnicos
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DataSourceBadge isRealData={true} size="md" />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                title="Atualizar dados"
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Control Panel */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Card className="p-4 bg-background/80 backdrop-blur border-border/50">
              <Label htmlFor="coin-select" className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Criptomoeda
              </Label>
              <Select 
                onValueChange={setSelectedCoin} 
                value={selectedCoin}
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
            
            <Card className="p-4 bg-background/80 backdrop-blur border-border/50">
              <Label htmlFor="days-select" className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Período de Análise
              </Label>
              <Select 
                onValueChange={(value) => setSelectedDays(Number(value))} 
                value={selectedDays.toString()}
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
          </div>
        </div>

        {/* Strategy Education - Always visible at top */}
        <StrategyEducation currentRSI={currentRSI} />

        {/* Market Pulse - Visual sentiment indicator */}
        <MarketPulse 
          rsi={currentRSI}
          volumeChange={calculatedMetrics.volumeChange}
          priceChange={calculatedMetrics.priceChange}
          coin={selectedCoin}
        />

        {/* Actionable Insights */}
        <ActionableInsights 
          rsi={currentRSI}
          marketData={marketData}
        />

        {/* Technical Gauges */}
        <TechnicalGaugeGrid 
          rsi={currentRSI}
          mma200Ratio={1.1}
          volumeChange={calculatedMetrics.volumeChange}
        />
        
        {/* Charts and Analysis */}
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
      </motion.div>
    </div>
  );
};

export default AnalisesCompraVenda;
