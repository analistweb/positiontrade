import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', Bitcoin: 4000, Ethereum: 2400, Dogecoin: 2400 },
  { name: 'Feb', Bitcoin: 3000, Ethereum: 1398, Dogecoin: 2210 },
  { name: 'Mar', Bitcoin: 2000, Ethereum: 9800, Dogecoin: 2290 },
  { name: 'Apr', Bitcoin: 2780, Ethereum: 3908, Dogecoin: 2000 },
  { name: 'May', Bitcoin: 1890, Ethereum: 4800, Dogecoin: 2181 },
  { name: 'Jun', Bitcoin: 2390, Ethereum: 3800, Dogecoin: 2500 },
  { name: 'Jul', Bitcoin: 3490, Ethereum: 4300, Dogecoin: 2100 },
];

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Crypto Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Cap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$1.23T</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$78.9B</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bitcoin Dominance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">42.3%</p>
          </CardContent>
        </Card>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
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