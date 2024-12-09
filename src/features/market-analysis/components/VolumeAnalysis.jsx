import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const VolumeAnalysis = ({ data, minVolume }) => {
  const processedData = React.useMemo(() => {
    if (!data?.total_volumes) return [];
    
    return data.total_volumes
      .filter(volume => volume[1] >= (minVolume || 0))
      .map((volume, index) => ({
        date: new Date(volume[0]).toLocaleDateString(),
        volume: volume[1]
      }));
  }, [data, minVolume]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="volume" name="Volume (USD)" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VolumeAnalysis;