import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

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

const SearchTrendsChart = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Tendências de Pesquisa do Bitcoin</CardTitle>
        <p className="text-sm text-gray-500">
          Volume de interesse e eventos significativos de Nov 2023 a Nov 2024
        </p>
      </CardHeader>
      <CardContent className="h-[500px]"> {/* Increased height for better readability */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={searchTrendsData} 
            margin={{ top: 30, right: 30, left: 20, bottom: 100 }} // Adjusted margins
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              angle={-45}
              textAnchor="end"
              height={80} // Increased height for labels
              tick={{ 
                fontSize: 12,
                fill: "#4B5563", // Better contrast
                dy: 10 // Move labels down
              }}
              interval={0}
            />
            <YAxis 
              label={{ 
                value: 'Volume de Interesse', 
                angle: -90, 
                position: 'insideLeft',
                style: { 
                  textAnchor: 'middle',
                  fill: "#4B5563",
                  fontSize: 12
                },
                dy: 50
              }}
              tick={{
                fontSize: 12,
                fill: "#4B5563"
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{
                paddingTop: "10px",
                fontSize: "14px"
              }}
            />
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
                    fontSize: 12,
                    offset: 20,
                    angle: -45, // Angled text for better readability
                    style: {
                      fontWeight: 500
                    }
                  }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SearchTrendsChart;