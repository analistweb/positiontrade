import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MarketStats = ({ bitcoinDominance, dominanceLoading, dominanceError }) => {
  return (
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
          {dominanceLoading ? (
            <p className="text-2xl font-bold">Carregando...</p>
          ) : dominanceError ? (
            <p className="text-2xl font-bold text-red-500">Erro ao carregar dados</p>
          ) : (
            <p className="text-2xl font-bold">{bitcoinDominance?.toFixed(2)}%</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketStats;