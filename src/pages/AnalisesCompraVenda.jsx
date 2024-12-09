import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import RSIRecommendation from '@/components/market/RSIRecommendation';
import { RSI } from 'technicalindicators';
import { fetchMarketData, fetchTopCoins } from '../services/marketService';
import VolumeChart from '../components/market/VolumeChart';
import MarketStats from '../components/market/MarketStats';
import EMAAnalysis from '../components/market/EMAAnalysis';

const AnalisesCompraVenda = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(90);
  const [minVolume, setMinVolume] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(50);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: marketData, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['marketData', selectedCoin, selectedDays],
    queryFn: () => fetchMarketData(selectedCoin, selectedDays),
    refetchInterval: 300000,
    retry: 3,
    onSuccess: () => {
      setLastUpdate(new Date());
      toast.success('Dados atualizados com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao buscar dados: ${error.message}`);
    }
  });

  const { data: topCoins } = useQuery({
    queryKey: ['topCoins'],
    queryFn: fetchTopCoins,
    refetchInterval: 300000
  });

  React.useEffect(() => {
    if (marketData?.prices) {
      const prices = marketData.prices.map(price => price[1]);
      const rsiValues = RSI.calculate({ values: prices, period: 14 });
      setCurrentRSI(rsiValues[rsiValues.length - 1]);
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
    </div>
  );
};

export default AnalisesCompraVenda;