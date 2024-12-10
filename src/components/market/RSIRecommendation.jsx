import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, TrendingUpIcon, RefreshCcw } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';
import { RSI } from 'technicalindicators';
import { toast } from "sonner";

const TOP_CRYPTOS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 
  'cardano', 'avalanche-2', 'polkadot', 'chainlink', 'polygon'
];

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error, refetch } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      try {
        console.log('Fetching RSI data...');
        const rsiData = {};
        
        // Initialize with null values
        TOP_CRYPTOS.forEach(crypto => {
          rsiData[crypto] = null;
        });

        // Fetch data for each crypto with individual error handling
        await Promise.all(TOP_CRYPTOS.map(async (crypto) => {
          try {
            const response = await axios.get(
              `${COINGECKO_API_URL}/coins/${crypto}/market_chart`,
              {
                params: {
                  vs_currency: 'usd',
                  days: '7',
                  interval: '4h'
                },
                headers: getHeaders(),
                timeout: 10000 // 10 second timeout
              }
            );

            if (response.data?.prices && Array.isArray(response.data.prices)) {
              const prices = response.data.prices
                .filter(price => Array.isArray(price) && price.length === 2 && typeof price[1] === 'number')
                .map(price => price[1]);

              if (prices.length >= 14) { // Minimum required periods for RSI
                const rsiValues = RSI.calculate({
                  values: prices,
                  period: 14
                });

                if (Array.isArray(rsiValues) && rsiValues.length > 0) {
                  rsiData[crypto] = rsiValues[rsiValues.length - 1];
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching data for ${crypto}:`, error);
            // Don't throw, just log and continue with other cryptos
          }
        }));

        // Check if we have at least some valid data
        const hasValidData = Object.values(rsiData).some(value => value !== null);
        if (!hasValidData) {
          throw new Error('Não foi possível obter dados RSI válidos');
        }

        console.log('RSI data calculated:', rsiData);
        return rsiData;
      } catch (error) {
        console.error('Error calculating RSI:', error);
        toast.error("Erro ao calcular RSI: " + error.message);
        throw error; // Let React Query handle the error state
      }
    },
    refetchInterval: 240000, // 4 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 60000 // Consider data stale after 1 minute
  });

  const oversoldCryptos = React.useMemo(() => {
    if (!cryptosRSI) return [];
    return Object.entries(cryptosRSI)
      .filter(([_, rsi]) => rsi !== null && rsi < 30)
      .sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0));
  }, [cryptosRSI]);

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

  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
            Erro ao Carregar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">
            Não foi possível carregar os dados do RSI. Por favor, tente novamente.
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCcw className="h-4 w-4" />
            Tentar Novamente
          </button>
        </CardContent>
      </Card>
    );
  }

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
          <div className="flex items-center justify-center py-8 gap-2">
            <RefreshCcw className="h-5 w-5 animate-spin" />
            <span>Calculando RSI...</span>
          </div>
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
                        RSI: {(rsi ?? 0).toFixed(2)}
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
                      RSI: {((cryptosRSI?.[crypto]) ?? 0).toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-muted-foreground text-right">
            Atualizado a cada 4 minutos
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RSIRecommendation;