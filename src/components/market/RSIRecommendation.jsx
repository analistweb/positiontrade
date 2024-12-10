import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, TrendingUpIcon, RefreshCwIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';
import axios from 'axios';
import { RSI } from 'technicalindicators';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TOP_CRYPTOS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 
  'cardano', 'avalanche-2', 'polkadot', 'chainlink', 'polygon'
];

const calculateRSI = (prices) => {
  if (!prices || prices.length < 14) return null;
  
  const values = prices.map(price => price[1]);
  const rsi = RSI.calculate({
    values: values,
    period: 14
  });
  
  return rsi[rsi.length - 1];
};

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error, refetch } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      try {
        const results = {};
        
        // Fetch data for each crypto in parallel
        await Promise.all(TOP_CRYPTOS.map(async (crypto) => {
          const response = await axios.get(
            `${COINGECKO_API_URL}/coins/${crypto}/market_chart`, {
              params: {
                vs_currency: 'usd',
                days: '7',  // Last 7 days
                interval: '4h'  // 4-hour intervals
              },
              headers: getHeaders(),
              timeout: 10000
            }
          );
          
          const rsi = calculateRSI(response.data.prices);
          if (rsi !== null) {
            results[crypto] = rsi;
          }
        }));
        
        return results;
      } catch (error) {
        console.error('Error fetching RSI data:', error);
        toast.error('Erro ao buscar dados do RSI. Tentando novamente...');
        throw error;
      }
    },
    refetchInterval: 240000, // 4 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi && rsi < 30)
      .sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0)) : [];

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
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Recomendação DCA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-destructive">Erro ao carregar dados do RSI</p>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Recomendação DCA
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            className="h-8 w-8"
          >
            <RefreshCwIcon className="h-4 w-4" />
          </Button>
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
                        RSI: {rsi?.toFixed(2) ?? 'N/A'}
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
                      RSI: {cryptosRSI[crypto]?.toFixed(2) ?? 'Carregando...'}
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