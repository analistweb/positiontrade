import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTopFormationData } from '../services/cryptoService';
import { toast } from "sonner";
import * as tf from '@tensorflow/tfjs';
import { RSI, BollingerBands } from 'technicalindicators';
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const FormacaoTopo = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topFormation'],
    queryFn: fetchTopFormationData,
    refetchInterval: 60000,
    retry: 3,
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
      console.error('Erro detalhado:', error);
    }
  });

  const analisarPadroesTopo = (precos) => {
    if (!precos?.length) {
      return {
        rsi: 0,
        bandaSuperior: 0,
        indicaFormacaoTopo: false
      };
    }

    try {
      const rsiValues = RSI.calculate({
        values: precos,
        period: 14
      });

      const bbValues = BollingerBands.calculate({
        period: 20,
        values: precos,
        stdDev: 2
      });

      const ultimoRSI = rsiValues[rsiValues.length - 1];
      const ultimoBB = bbValues[bbValues.length - 1];
      const ultimoPreco = precos[precos.length - 1];

      return {
        rsi: ultimoRSI,
        bandaSuperior: ultimoBB?.upper || 0,
        indicaFormacaoTopo: ultimoRSI > 70 && ultimoPreco >= (ultimoBB?.upper || 0)
      };
    } catch (err) {
      console.error('Erro ao analisar padrões:', err);
      return {
        rsi: 0,
        bandaSuperior: 0,
        indicaFormacaoTopo: false
      };
    }
  };

  const preverFormacaoTopo = async (precos) => {
    if (!precos?.length) return null;

    try {
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [10] }));
      
      const dados = precos.slice(-30);
      const xs = tf.tensor2d(dados.slice(0, -1), [dados.length - 1, 1]);
      const ys = tf.tensor2d(dados.slice(1), [dados.length - 1, 1]);
      
      await model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
      await model.fit(xs, ys, { epochs: 10 });
      
      const ultimosDados = tf.tensor2d(dados.slice(-10), [1, 10]);
      const previsao = model.predict(ultimosDados);
      
      return previsao.dataSync()[0];
    } catch (error) {
      console.error('Erro na previsão:', error);
      return null;
    }
  };

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

  const chartData = data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));

  const precos = data.prices.map(([_, price]) => price);
  const analise = analisarPadroesTopo(precos);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">Formação de Topo</h1>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px'
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
              <CardTitle>Indicadores Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-card/50 rounded-lg">
                  <p className="flex justify-between items-center">
                    <span>RSI Atual:</span>
                    <span className="font-mono">{analise.rsi?.toFixed(2) || 'N/A'}</span>
                  </p>
                </div>
                <div className="p-4 bg-card/50 rounded-lg">
                  <p className="flex justify-between items-center">
                    <span>Banda Superior:</span>
                    <span className="font-mono">${analise.bandaSuperior?.toFixed(2) || 'N/A'}</span>
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${analise.indicaFormacaoTopo ? "bg-destructive/20" : "bg-primary/20"}`}>
                  <p className={`text-center font-medium ${analise.indicaFormacaoTopo ? "text-destructive" : "text-primary"}`}>
                    {analise.indicaFormacaoTopo 
                      ? "⚠️ Possível formação de topo detectada" 
                      : "✅ Sem indicação de topo no momento"}
                  </p>
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
              <CardTitle>Análise de Entidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-card/50 rounded-lg">
                  <p className="flex justify-between items-center">
                    <span>Volume de Grandes Entidades:</span>
                    <span className="font-mono">
                      ${((data.total_volumes?.[data.total_volumes.length - 1]?.[1] || 0) / 1000000).toFixed(2)}M
                    </span>
                  </p>
                </div>
                <div className="p-4 bg-card/50 rounded-lg">
                  <p className="flex justify-between items-center">
                    <span>Variação 24h:</span>
                    <span className={`font-mono ${
                      ((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                      data.prices?.[data.prices.length - 24]?.[1] * 100) > 0 
                        ? "text-green-500" 
                        : "text-red-500"
                    }`}>
                      {((data.prices?.[data.prices.length - 1]?.[1] - data.prices?.[data.prices.length - 24]?.[1]) / 
                        data.prices?.[data.prices.length - 24]?.[1] * 100)?.toFixed(2) || 0}%
                    </span>
                  </p>
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