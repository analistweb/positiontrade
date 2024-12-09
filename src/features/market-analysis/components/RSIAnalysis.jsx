import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RSIAnalysis = ({ rsiValue }) => {
  const getRSIStatus = (value) => {
    if (value >= 70) return { status: 'Sobrecomprado', variant: 'destructive' };
    if (value <= 30) return { status: 'Sobrevendido', variant: 'success' };
    return { status: 'Neutro', variant: 'secondary' };
  };

  const { status, variant } = getRSIStatus(rsiValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Análise RSI
          <Badge variant={variant}>{status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>RSI Atual: {rsiValue?.toFixed(2) || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">
            {status === 'Sobrecomprado' && 'Considere realizar lucros'}
            {status === 'Sobrevendido' && 'Possível ponto de entrada'}
            {status === 'Neutro' && 'Aguarde por melhores sinais'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RSIAnalysis;