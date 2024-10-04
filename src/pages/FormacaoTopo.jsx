import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as tf from '@tensorflow/tfjs';

const fetchHistoricalData = async () => {
  const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
    params: {
      vs_currency: 'usd',
      days: 90,
      interval: 'daily'
    }
  });
  return response.data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price
  }));
};

const identifyTopFormation = (data) => {
  const prices = data.map(d => d.price);
  const movingAverage = calculateMovingAverage(prices, 7);
  const resistanceLevel = Math.max(...prices.slice(-30));
  
  const topFormationPattern = prices.slice(-5).every((price, index, arr) => {
    return index === 0 || price <= arr[index - 1];
  });

  return {
    isTopFormation: topFormationPattern,
    resistanceLevel: resistanceLevel,
    lastPrice: prices[prices.length - 1]
  };
};

const calculateMovingAverage = (data, window) => {
  return data.map((_, index, array) => {
    const start = Math.max(0, index - window + 1);
    const end = index + 1;
    return array.slice(start, end).reduce((sum, num) => sum + num, 0) / (end - start);
  });
};

const trainModel = async (data) => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [7] }));
  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

  const xs = tf.tensor2d(data.slice(0, -1).map(d => d.price));
  const ys = tf.tensor2d(data.slice(7).map(d => [d.price]));

  await model.fit(xs, ys, { epochs: 100 });
  return model;
};

const FormacaoTopo = () => {
  const { data: historicalData, isLoading, error } = useQuery({
    queryKey: ['bitcoinHistoricalData'],
    queryFn: fetchHistoricalData,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  const [topFormation, setTopFormation] = useState(null);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    if (historicalData) {
      const formation = identifyTopFormation(historicalData);
      setTopFormation(formation);

      const trainAndPredict = async () => {
        const model = await trainModel(historicalData);
        const lastWeekPrices = historicalData.slice(-7).map(d => d.price);
        const input = tf.tensor2d([lastWeekPrices]);
        const predictedPrice = model.predict(input);
        setPrediction(await predictedPrice.data());
      };

      trainAndPredict();
    }
  }, [historicalData]);

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar os dados: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Formação de Topo</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gráfico de Preços (90 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
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

      {topFormation && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Análise de Formação de Topo</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Possível formação de topo: {topFormation.isTopFormation ? 'Sim' : 'Não'}</p>
            <p>Nível de resistência: ${topFormation.resistanceLevel.toFixed(2)}</p>
            <p>Último preço: ${topFormation.lastPrice.toFixed(2)}</p>
            {prediction && (
              <p>Previsão de preço para amanhã: ${prediction[0].toFixed(2)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Interpretação dos Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            A análise de formação de topo considera os últimos 5 dias de preços. Se houver uma tendência de queda
            consistente nesse período, isso pode indicar uma possível formação de topo.
          </p>
          <p className="mt-2">
            O nível de resistência é calculado como o preço máximo nos últimos 30 dias. Se o preço atual estiver
            próximo desse nível e houver sinais de formação de topo, isso pode indicar uma possível reversão.
          </p>
          <p className="mt-2">
            A previsão de preço para o próximo dia é baseada em um modelo de aprendizado de máquina simples,
            treinado com os dados históricos. Esta previsão deve ser considerada apenas como uma referência e
            não como uma garantia de movimento futuro do mercado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormacaoTopo;