import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTopFormationData } from '../services/cryptoService';
import { toast } from "sonner";
import * as tf from '@tensorflow/tfjs';
import { RSI, BollingerBands } from 'technicalindicators';
import { Loader2, AlertTriangle, Info, Clock, TrendingDown, TrendingUp, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const analisarPadroesTopo = (precos) => {
  if (!precos || precos.length < 14) {
    return {
      rsi: null,
      bandaSuperior: null,
      bandaInferior: null
    };
  }

  // Calcula o RSI
  const rsiInput = {
    values: precos,
    period: 14
  };
  const rsiValues = RSI.calculate(rsiInput);
  const rsiAtual = rsiValues[rsiValues.length - 1];

  // Calcula as Bandas de Bollinger
  const bbInput = {
    period: 20,
    values: precos,
    stdDev: 2
  };
  const bb = BollingerBands.calculate(bbInput);
  const ultimaBB = bb[bb.length - 1];

  return {
    rsi: rsiAtual,
    bandaSuperior: ultimaBB?.upper,
    bandaInferior: ultimaBB?.lower
  };
};

const FormacaoTopo = () => {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['topFormation'],
    queryFn: fetchTopFormationData,
    refetchInterval: 60000,
    retry: 3,
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
      console.error('Erro detalhado:', error);
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-8 w-8 text-primary" />
            </motion.div>
            <span className="ml-2 text-muted-foreground">Carregando análise...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data?.prices?.length) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-destructive text-lg">
                Não foi possível carregar os dados no momento.
              </p>
              <p className="text-muted-foreground">
                Por favor, verifique sua conexão e tente novamente em alguns instantes.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const chartData = data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));

  const precos = data.prices.map(([_, price]) => price);
  const analise = analisarPadroesTopo(precos);

  const lastUpdateTime = new Date(dataUpdatedAt).toLocaleTimeString();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Formação de Topo</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última atualização: {lastUpdateTime}</span>
          </div>
        </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Análise de Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis 
                  dataKey="date"
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background/95 p-4 rounded-lg border shadow-lg">
                          <p className="font-semibold">{label}</p>
                          <p className="text-primary font-mono">
                            {formatCurrency(payload[0].value)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Indicadores Técnicos
                <TooltipProvider>
                  <TooltipUI>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Indicadores técnicos são ferramentas estatísticas que ajudam a analisar o mercado</p>
                    </TooltipContent>
                  </TooltipUI>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-card/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <TooltipProvider>
                      <TooltipUI>
                        <TooltipTrigger className="flex items-center gap-2">
                          <span>RSI Atual:</span>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4">
                          <p>O RSI (Índice de Força Relativa) mede a velocidade e magnitude das mudanças de preço:</p>
                          <ul className="list-disc list-inside mt-2">
                            <li>RSI > 70: Mercado sobrecomprado</li>
                            <li>RSI < 30: Mercado sobrevendido</li>
                            <li>Entre 30-70: Zona neutra</li>
                          </ul>
                        </TooltipContent>
                      </TooltipUI>
                    </TooltipProvider>
                    <span className={`font-mono ${
                      analise.rsi > 70 ? "text-red-500" : 
                      analise.rsi < 30 ? "text-green-500" : 
                      "text-yellow-500"
                    }`}>
                      {analise.rsi?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-card/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <TooltipProvider>
                      <TooltipUI>
                        <TooltipTrigger className="flex items-center gap-2">
                          <span>Banda Superior:</span>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4">
                          <p>Bandas de Bollinger são indicadores de volatilidade:</p>
                          <ul className="list-disc list-inside mt-2">
                            <li>Preço próximo à banda superior: Possível sobrevalorização</li>
                            <li>Preço entre as bandas: Volatilidade normal</li>
                            <li>Usado para identificar possíveis reversões</li>
                          </ul>
                        </TooltipContent>
                      </TooltipUI>
                    </TooltipProvider>
                    <span className="font-mono">${analise.bandaSuperior?.toFixed(2) || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-4 bg-destructive/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <p className="text-center font-medium text-destructive">
                      Confirmação de formação de topo detectada
                    </p>
                    <TooltipProvider>
                      <TooltipUI>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4">
                          <p>Uma formação de topo é identificada quando:</p>
                          <ul className="list-disc list-inside mt-2">
                            <li>RSI mostra condições de sobrecompra</li>
                            <li>Preço atinge ou ultrapassa a Banda Superior</li>
                            <li>Volume de vendas aumenta significativamente</li>
                          </ul>
                          <p className="mt-2 text-destructive">Considere reduzir exposição ao risco</p>
                        </TooltipContent>
                      </TooltipUI>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Análise de Entidades
                <TooltipProvider>
                  <TooltipUI>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Análise do comportamento das grandes entidades (whales) do mercado</p>
                    </TooltipContent>
                  </TooltipUI>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-card/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <TooltipProvider>
                      <TooltipUI>
                        <TooltipTrigger className="flex items-center gap-2">
                          <span>Volume de Grandes Entidades:</span>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4">
                          <p>Volume movimentado por grandes players (whales):</p>
                          <ul className="list-disc list-inside mt-2">
                            <li>Alto volume: Possível mudança de tendência</li>
                            <li>Volume crescente: Aumento de interesse institucional</li>
                            <li>Volume > $20B: Atividade significativa</li>
                          </ul>
                        </TooltipContent>
                      </TooltipUI>
                    </TooltipProvider>
                    <span className="font-mono">
                      ${((data.total_volumes?.[data.total_volumes.length - 1]?.[1] || 0) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-card/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <TooltipProvider>
                      <TooltipUI>
                        <TooltipTrigger className="flex items-center gap-2">
                          <span>Variação 24h:</span>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4">
                          <p>Variação percentual nas últimas 24 horas:</p>
                          <ul className="list-disc list-inside mt-2">
                            <li>Positiva: Movimento de alta no período</li>
                            <li>Negativa: Movimento de baixa no período</li>
                            <li>Alta volatilidade: Variação > 5%</li>
                          </ul>
                        </TooltipContent>
                      </TooltipUI>
                    </TooltipProvider>
                    <div className="flex items-center gap-2">
                      {((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                        data.prices?.[data.prices.length - 24]?.[1] * 100) > 0 ? 
                        <TrendingUp className="h-4 w-4 text-green-500" /> :
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      }
                      <span className={`font-mono ${
                        ((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                        data.prices?.[data.prices.length - 24]?.[1] * 100) > 0 
                          ? "text-green-500" 
                          : "text-red-500"
                      }`}>
                        {((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                          data.prices?.[data.prices.length - 24]?.[1] * 100)?.toFixed(2) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FormacaoTopo;
