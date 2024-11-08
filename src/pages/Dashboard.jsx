import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const searchTrendsData = [
  { month: 'Nov 2023', interesse: 65, evento: 'Aprovação ETF Bitcoin' },
  { month: 'Dez 2023', interesse: 85, evento: 'Bitcoin atinge $44k' },
  { month: 'Jan 2024', interesse: 100, evento: 'ETF Bitcoin aprovado' },
  { month: 'Fev 2024', interesse: 75 },
  { month: 'Mar 2024', interesse: 90, evento: 'Halving Bitcoin' },
  { month: 'Abr 2024', interesse: 70 },
  { month: 'Mai 2024', interesse: 60 },
  { month: 'Jun 2024', interesse: 55 },
  { month: 'Jul 2024', interesse: 65 },
  { month: 'Ago 2024', interesse: 75 },
  { month: 'Set 2024', interesse: 80 },
  { month: 'Out 2024', interesse: 85 },
  { month: 'Nov 2024', interesse: 95 }
];

const priceData = [
  { name: 'Jan', Bitcoin: 4000, Ethereum: 2400, Dogecoin: 2400 },
  { name: 'Fev', Bitcoin: 3000, Ethereum: 1398, Dogecoin: 2210 },
  { name: 'Mar', Bitcoin: 2000, Ethereum: 9800, Dogecoin: 2290 },
  { name: 'Abr', Bitcoin: 2780, Ethereum: 3908, Dogecoin: 2000 },
  { name: 'Mai', Bitcoin: 1890, Ethereum: 4800, Dogecoin: 2181 },
  { name: 'Jun', Bitcoin: 2390, Ethereum: 3800, Dogecoin: 2500 },
  { name: 'Jul', Bitcoin: 3490, Ethereum: 4300, Dogecoin: 2100 }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-sm">Interesse: {payload[0].value}</p>
        {payload[0].payload.evento && (
          <p className="text-sm text-blue-600">Evento: {payload[0].payload.evento}</p>
        )}
      </div>
    );
  }
  return null;
};

const fetchBitcoinDominance = async () => {
  const response = await axios.get('https://api.coingecko.com/api/v3/global');
  return response.data.data.market_cap_percentage.btc;
};

const Dashboard = () => {
  const { data: bitcoinDominance, isLoading, error } = useQuery({
    queryKey: ['bitcoinDominance'],
    queryFn: fetchBitcoinDominance,
    refetchInterval: 300000,
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Painel de Criptomoedas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Capitalização de Mercado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ 6,15 T</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Volume 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ 394,5 B</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dominância do Bitcoin</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-2xl font-bold">Carregando...</p>
            ) : error ? (
              <p className="text-2xl font-bold text-red-500">Erro ao carregar dados</p>
            ) : (
              <p className="text-2xl font-bold">{bitcoinDominance.toFixed(2)}%</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tendências de Pesquisa do Bitcoin</CardTitle>
          <p className="text-sm text-gray-500">
            Volume de interesse e eventos significativos de Nov 2023 a Nov 2024
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={searchTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ 
                  value: 'Volume de Interesse', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey="interesse" 
                name="Interesse de Pesquisa"
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8, fill: "#1e40af" }}
              />
              {searchTrendsData.map((entry, index) => (
                entry.evento && (
                  <ReferenceLine
                    key={index}
                    x={entry.month}
                    stroke="#dc2626"
                    strokeDasharray="3 3"
                    label={{
                      value: entry.evento,
                      position: 'top',
                      fill: '#dc2626',
                      fontSize: 12
                    }}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gráfico de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Bitcoin" stroke="#8884d8" />
              <Line type="monotone" dataKey="Ethereum" stroke="#82ca9d" />
              <Line type="monotone" dataKey="Dogecoin" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;