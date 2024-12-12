import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTopFormationData } from '../services/cryptoService';
import { toast } from "sonner";
import * as tf from '@tensorflow/tfjs';
import { RSI, BollingerBands } from 'technicalindicators';

const FormacaoTopo = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topFormation'],
    queryFn: () => fetchTopFormationData(),
    refetchInterval: 60000,
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  });

  const analisarPadroesTopo = (precos) => {
    // Cálculo do RSI
    const rsiValues = RSI.calculate({
      values: precos,
      period: 14
    });

    // Cálculo das Bandas de Bollinger
    const bbValues = BollingerBands.calculate({
      period: 20,
      values: precos,
      stdDev: 2
    });

    // Identificar possível formação de topo
    const ultimoRSI = rsiValues[rsiValues.length - 1];
    const ultimoBB = bbValues[bbValues.length - 1];
    const ultimoPreco = precos[precos.length - 1];

    return {
      rsi: ultimoRSI,
      bandaSuperior: ultimoBB.upper,
      indicaFormacaoTopo: ultimoRSI > 70 && ultimoPreco >= ultimoBB.upper
    };
  };

  const preverFormacaoTopo = async (precos) => {
    try {
      // Criar e treinar um modelo simples de ML
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [10] }));
      
      // Preparar dados para treinamento
      const dados = precos.slice(-30);
      const xs = tf.tensor2d(dados.slice(0, -1), [dados.length - 1, 1]);
      const ys = tf.tensor2d(dados.slice(1), [dados.length - 1, 1]);
      
      await model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
      await model.fit(xs, ys, { epochs: 10 });
      
      // Fazer previsão
      const ultimosDados = tf.tensor2d(dados.slice(-10), [1, 10]);
      const previsao = model.predict(ultimosDados);
      
      return previsao.dataSync()[0];
    } catch (error) {
      console.error('Erro na previsão:', error);
      return null;
    }
  };

  if (isLoading) return <div className="p-4">Carregando dados...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error.message}</div>;

  const chartData = data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));

  const precos = data.prices.map(([_, price]) => price);
  const analise = analisarPadroesTopo(precos);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Formação de Topo</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Análise de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Indicadores Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>RSI Atual: {analise.rsi?.toFixed(2)}</p>
              <p>Banda Superior: ${analise.bandaSuperior?.toFixed(2)}</p>
              <p className={analise.indicaFormacaoTopo ? "text-red-500 font-bold" : "text-green-500"}>
                {analise.indicaFormacaoTopo 
                  ? "⚠️ Possível formação de topo detectada" 
                  : "✅ Sem indicação de topo no momento"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Entidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Volume de Grandes Entidades: ${(data.total_volumes[data.total_volumes.length - 1][1] / 1000000).toFixed(2)}M</p>
              <p>Variação 24h: {((data.prices[data.prices.length - 1][1] - data.prices[data.prices.length - 24][1]) / data.prices[data.prices.length - 24][1] * 100).toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormacaoTopo;