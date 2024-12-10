import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, TrendingUpIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

const TOP_CRYPTOS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 
  'cardano', 'avalanche-2', 'polkadot', 'chainlink', 'polygon'
];

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      // Simulated RSI data for demonstration
      // In a real implementation, this would fetch from your API
      return {
        'bitcoin': 77.07,
        'ethereum': 72.35,
        'binancecoin': 68.92,
        'solana': 81.45,
        'ripple': 65.23,
        'cardano': 58.92,
        'avalanche-2': 75.34,
        'polkadot': 69.45,
        'chainlink': 71.23,
        'polygon': 73.56
      };
    },
    refetchInterval: 300000 // 5 minutes
  });

  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi < 30)
      .sort((a, b) => a[1] - b[1]) : [];

  const getCryptoName = (id) => {
    const names = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'binancecoin': 'BNB',
      'solana': 'Solana',
      'ripple': 'XRP',
      'cardano': 'Cardano',
      'avalanche-2': 'Avalanche',
      'polkadot': 'Polkadot',
      'chainlink': 'Chainlink',
      'polygon': 'Polygon'
    };
    return names[id] || id;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Recomendação DCA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

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
          {oversoldCryptos.length > 0 ? (
            <>
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✨ Oportunidades de DCA Encontradas!
                </p>
                <div className="mt-3 space-y-2">
                  {oversoldCryptos.map(([crypto, rsi]) => (
                    <div key={crypto} className="flex justify-between items-center">
                      <span className="text-green-700">{getCryptoName(crypto)}</span>
                      <Badge variant="secondary">
                        RSI: {rsi.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-green-600 mt-3">
                  Estas criptomoedas apresentam RSI em níveis de sobre-venda, 
                  sugerindo possíveis pontos de entrada para sua estratégia DCA.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4" />
                Nenhuma oportunidade encontrada
              </p>
              <p className="text-sm text-gray-600 mt-1">
                O RSI não indica sobre-venda no momento para nenhuma das principais criptomoedas. 
                Continue monitorando para melhores pontos de entrada.
              </p>
              <div className="mt-3 space-y-2">
                {TOP_CRYPTOS.slice(0, 5).map(crypto => (
                  <div key={crypto} className="flex justify-between items-center">
                    <span>{getCryptoName(crypto)}</span>
                    <Badge variant="secondary">
                      RSI: {cryptosRSI[crypto].toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RSIRecommendation;