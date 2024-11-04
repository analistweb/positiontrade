import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import RSIRecommendation from '@/components/market/RSIRecommendation';
import { RSI } from 'technicalindicators';
import { fetchMarketData, fetchCoinPrice } from '../services/marketService';
import VolumeChart from '../components/market/VolumeChart';
import MarketStats from '../components/market/MarketStats';

const AnalisesCompraVenda = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(30);
  const [minVolume, setMinVolume] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(50);

  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['marketData', selectedCoin, selectedDays],
    queryFn: () => fetchMarketData(selectedCoin, selectedDays),
    refetchInterval: 300000,
    retry: 3,
    onError: (error) => {
      toast.error(`Erro ao buscar dados: ${error.message}`);
    }
  });

  useEffect(() => {
    if (marketData?.prices) {
      const prices = marketData.prices.map(price => price[1]);
      const rsiValues = RSI.calculate({ values: prices, period: 14 });
      setCurrentRSI(rsiValues[rsiValues.length - 1]);
    }
  }, [marketData]);

  if (isLoading) return <div className="p-4">Carregando dados do mercado...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Análise de Compra/Venda</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="coin-select">Criptomoeda</Label>
          <Select onValueChange={setSelectedCoin} defaultValue={selectedCoin}>
            <SelectTrigger id="coin-select">
              <SelectValue placeholder="Selecione uma criptomoeda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bitcoin">Bitcoin</SelectItem>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="cardano">Cardano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="days-select">Período</Label>
          <Select onValueChange={(value) => setSelectedDays(Number(value))} defaultValue={selectedDays.toString()}>
            <SelectTrigger id="days-select">
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="min-volume">Volume Mínimo (USD)</Label>
          <Input
            id="min-volume"
            type="number"
            value={minVolume}
            onChange={(e) => setMinVolume(Number(e.target.value))}
            placeholder="Volume mínimo"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <VolumeChart marketData={marketData} minVolume={minVolume} />
        </div>
        
        <div>
          <RSIRecommendation rsiValue={currentRSI} />
          <MarketStats marketData={marketData} />
        </div>
      </div>
    </div>
  );
};

export default AnalisesCompraVenda;