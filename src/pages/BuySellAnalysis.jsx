import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { price: '0-10k', buy: 4000, sell: 2400 },
  { price: '10k-20k', buy: 3000, sell: 1398 },
  { price: '20k-30k', buy: 2000, sell: 9800 },
  { price: '30k-40k', buy: 2780, sell: 3908 },
  { price: '40k-50k', buy: 1890, sell: 4800 },
  { price: '50k+', buy: 2390, sell: 3800 },
];

const BuySellAnalysis = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Buy/Sell Analysis</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buy/Sell Volume by Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="price" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="buy" fill="#82ca9d" />
              <Bar dataKey="sell" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Buy Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$16.06B</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Sell Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$26.11B</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuySellAnalysis;