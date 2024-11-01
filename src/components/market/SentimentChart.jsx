import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SentimentChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="platform" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="sentiment" name="Sentimento %" fill="#8884d8" />
      <Bar dataKey="volume" name="Volume" fill="#82ca9d" />
    </BarChart>
  </ResponsiveContainer>
);

export default SentimentChart;