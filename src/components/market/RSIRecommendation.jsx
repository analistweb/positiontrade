import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, TrendingUpIcon } from "lucide-react";

const RSIRecommendation = ({ rsiValue }) => {
  const isOversold = rsiValue < 30;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5" />
          Recomendação DCA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>RSI (4h):</span>
            <Badge variant={isOversold ? "destructive" : "secondary"}>
              {rsiValue.toFixed(2)}
            </Badge>
          </div>
          
          {isOversold ? (
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-green-800 font-medium">
                ✨ Boa oportunidade para DCA!
              </p>
              <p className="text-sm text-green-600 mt-1">
                O RSI indica que o ativo está sobre-vendido, sugerindo um bom momento para aplicar sua estratégia DCA de longo prazo.
              </p>
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4" />
                Aguarde melhor oportunidade
              </p>
              <p className="text-sm text-gray-600 mt-1">
                O RSI não indica sobre-venda no momento. Continue monitorando para melhores pontos de entrada.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RSIRecommendation;