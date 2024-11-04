import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RSIRecommendation from '@/components/market/RSIRecommendation';
import { RSI } from 'technicalindicators';

const fetchMarketData = async (coin, days) => {
  const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
    params: {
      ids: coin,
      vs_currencies: 'usd',
      include_24hr_vol: true,
      include_24hr_change: true,
      include_last_updated_at: true
    }
  });

  // Simular dados históricos para o RSI já que o endpoint gratuito não fornece
  const simulatedPrices = Array.from({ length: 100 }, (_, i) => {
    const basePrice = response.data[coin].usd;
    return basePrice * (1 + Math.sin(i / 10) * 0.1);
  });

  return {
    prices: simulatedPrices.map((price, index) => [Date.now() - (index * 3600000), price]),
    total_volumes: simulatedPrices.map((_, index) => [
      Date.now() - (index * 3600000),
      response.data[coin].usd_24h_vol / 100
    ])
  };
};

const calculateRSI = (prices, period = 14) => {
  const rsiInput = {
    values: prices,
    period: period
  };
  return RSI.calculate(rsiInput);
};

const AnalisesCompraVenda = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(30);
  const [minVolume, setMinVolume] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(50);

  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['marketData', selectedCoin, selectedDays],
    queryFn: () => fetchMarketData(selectedCoin, selectedDays),
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    retry: 3,
    onError: (error) => {
      console.error('Erro ao buscar dados:', error);
    }
  });

  useEffect(() => {
    if (marketData?.prices) {
      const prices = marketData.prices.map(price => price[1]);
      const rsiValues = calculateRSI(prices);
      setCurrentRSI(rsiValues[rsiValues.length - 1]);
    }
  }, [marketData]);

  const processData = (data) => {
    if (!data) return [];
    const priceRanges = {};
    data.prices.forEach((price, index) => {
      const [timestamp, priceValue] = price;
      const volume = data.total_volumes[index][1];
      if (volume < minVolume) return;

      const priceRange = Math.floor(priceValue / 1000) * 1000;
      const rangeKey = `${priceRange}-${priceRange + 999}`;
      
      if (!priceRanges[rangeKey]) {
        priceRanges[rangeKey] = { buy: 0, sell: 0 };
      }
      
      if (index > 0 && priceValue > data.prices[index - 1][1]) {
        priceRanges[rangeKey].buy += volume;
      } else {
        priceRanges[rangeKey].sell += volume;
      }
    });

    return Object.entries(priceRanges).map(([range, volumes]) => ({
      preco: range,
      compra: volumes.buy,
      venda: volumes.sell
    }));
  };

  const chartData = processData(marketData);
  const totalBuyVolume = chartData.reduce((sum, item) => sum + item.compra, 0);
  const totalSellVolume = chartData.reduce((sum, item) => sum + item.venda, 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-lg">Carregando dados do mercado...</p>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-lg text-red-500">
        Erro ao carregar os dados. Por favor, tente novamente mais tarde.
        {error.message && <span className="block text-sm mt-2">{error.message}</span>}
      </p>
    </div>
  );

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Volume de Compra/Venda por Faixa de Preço</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="preco" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="compra" name="Compra" fill="#82ca9d" />
                  <Bar dataKey="venda" name="Venda" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <RSIRecommendation rsiValue={currentRSI} />
          
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Volume Total de Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${totalBuyVolume.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Volume Total de Venda</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${totalSellVolume.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalisesCompraVenda;
