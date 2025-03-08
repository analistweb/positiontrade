
import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bitcoin, Coins } from "lucide-react";
import { RSICard } from './RSICard';
import { LoadingRSI } from './LoadingRSI';
import { ErrorRSI } from './ErrorRSI';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '@/config/api';
import { toast } from "sonner";
import { calculateRSI } from '@/utils/rsiCalculator';

// Lista de criptomoedas focadas - apenas Bitcoin, Ethereum, Cardano, XRP, e Solana
const FOCUSED_CRYPTOS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', priority: 1 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', priority: 2 },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', priority: 3 },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', priority: 4 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', priority: 5 }
];

const RSIRecommendation = () => {
  const { data: cryptosRSI, isLoading, error } = useQuery({
    queryKey: ['cryptosRSI'],
    queryFn: async () => {
      try {
        // Buscar dados apenas para as criptomoedas específicas
        const cryptoIds = FOCUSED_CRYPTOS.map(crypto => crypto.id).join(',');
        
        const response = await axios.get(
          `${COINGECKO_API_URL}/coins/markets`,
          {
            params: {
              vs_currency: 'usd',
              ids: cryptoIds,
              order: 'market_cap_desc',
              per_page: 10,
              sparkline: true,
              price_change_percentage: '24h'
            },
            headers: getHeaders()
          }
        );

        if (!response.data) {
          throw new Error('Dados RSI não disponíveis');
        }

        const rsiData = {};
        
        // Utiliza a função rsiCalculator para calcular o RSI de cada criptomoeda
        response.data.forEach(coin => {
          if (coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
            // Formata os dados para o cálculo do RSI (converte para o formato [timestamp, price])
            const prices = coin.sparkline_in_7d.price.map((price, index) => 
              [Date.now() - (168 - index) * 3600000, price]
            );
            
            // Calcula o RSI usando a função importada
            const rsi = calculateRSI(prices);
            
            // Armazena o resultado
            rsiData[coin.id] = {
              rsi: rsi,
              name: coin.name,
              symbol: coin.symbol,
              price: coin.current_price,
              priceChange24h: coin.price_change_percentage_24h,
              priority: FOCUSED_CRYPTOS.find(c => c.id === coin.id)?.priority || 99
            };
          }
        });

        console.log('RSI data calculated for focused cryptos:', rsiData);
        return rsiData;
      } catch (error) {
        console.error('Error calculating RSI for focused cryptos:', error);
        toast.error('Erro ao calcular RSI para as criptomoedas selecionadas');
        throw error;
      }
    },
    refetchInterval: 300000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onError: (error) => {
      console.error('Error in RSI query:', error);
    }
  });

  if (isLoading) return <LoadingRSI />;
  if (error) return <ErrorRSI />;

  // Filtra criptomoedas com RSI < 30 (possíveis oportunidades DCA)
  const oversoldCryptos = cryptosRSI ? 
    Object.entries(cryptosRSI)
      .filter(([_, data]) => data.rsi !== null && data.rsi < 30)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([crypto, data]) => ({ id: crypto, ...data })) : [];

  // Todas as criptomoedas ordenadas por prioridade (BTC e ETH primeiro)
  const allCryptos = cryptosRSI ?
    Object.entries(cryptosRSI)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([crypto, data]) => ({ id: crypto, ...data })) : [];

  return (
    <RSICard>
      <AnimatePresence mode="wait">
        {oversoldCryptos.length > 0 ? (
          <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-semibold text-lg flex items-center gap-2">
              <Bitcoin className="h-5 w-5" />
              Oportunidades de DCA Encontradas!
            </p>
            
            <div className="mt-4 space-y-3">
              {oversoldCryptos.map(crypto => (
                <motion.div
                  key={crypto.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                    crypto.id === 'bitcoin' || crypto.id === 'ethereum' 
                      ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30'
                      : 'bg-white/80 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/30'
                  }`}
                >
                  <span className={`font-medium ${
                    crypto.id === 'bitcoin' || crypto.id === 'ethereum'
                      ? 'text-primary'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}>
                    {crypto.name} ({crypto.symbol.toUpperCase()})
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm">
                      RSI: {crypto.rsi?.toFixed(2) || 'N/A'}
                    </span>
                    <span className={`text-xs ${
                      crypto.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crypto.priceChange24h?.toFixed(2)}% (24h)
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <p className="text-sm text-green-600 dark:text-green-300 mt-4">
              Estas criptomoedas apresentam RSI em níveis de sobre-venda, 
              sugerindo possíveis pontos de entrada para sua estratégia DCA.
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Nenhuma oportunidade DCA encontrada
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
              O RSI não indica sobre-venda no momento para as criptomoedas selecionadas. 
              Continue monitorando para melhores pontos de entrada.
            </p>
            
            <div className="mt-4 space-y-3">
              {allCryptos.map(crypto => (
                <motion.div
                  key={crypto.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                    crypto.id === 'bitcoin' || crypto.id === 'ethereum' 
                      ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30'
                      : 'bg-white/80 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/30'
                  }`}
                >
                  <span className={`font-medium ${
                    crypto.id === 'bitcoin' || crypto.id === 'ethereum'
                      ? 'text-primary'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}>
                    {crypto.name} ({crypto.symbol.toUpperCase()})
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm">
                      RSI: {crypto.rsi?.toFixed(2) || 'N/A'}
                    </span>
                    <span className={`text-xs ${
                      crypto.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crypto.priceChange24h?.toFixed(2)}% (24h)
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </RSICard>
  );
};

export default RSIRecommendation;
