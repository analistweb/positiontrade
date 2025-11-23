import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';

const FearGreedIndex = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['fearGreedIndex'],
    queryFn: async () => {
      try {
        const response = await axios.get('https://api.alternative.me/fng/', {
          params: { limit: 1 },
          timeout: 10000
        });
        
        if (!response.data?.data?.[0]) {
          throw new Error('Dados não disponíveis');
        }
        
        return response.data.data[0];
      } catch (error) {
        console.error('Erro ao buscar Fear & Greed Index:', error);
        toast.error('Erro ao carregar índice de Medo e Ganância');
        throw error;
      }
    },
    refetchInterval: 300000, // 5 minutos
    staleTime: 240000,
    retry: 2
  });

  const getIndexColor = (value) => {
    if (value <= 25) return 'text-red-500';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 75) return 'text-green-400';
    return 'text-green-500';
  };

  const getIndexBgColor = (value) => {
    if (value <= 25) return 'bg-red-500/10';
    if (value <= 45) return 'bg-orange-500/10';
    if (value <= 55) return 'bg-yellow-500/10';
    if (value <= 75) return 'bg-green-400/10';
    return 'bg-green-500/10';
  };

  const getIndexLabel = (value) => {
    if (value <= 25) return 'Medo Extremo';
    if (value <= 45) return 'Medo';
    if (value <= 55) return 'Neutro';
    if (value <= 75) return 'Ganância';
    return 'Ganância Extrema';
  };

  const getIndexIcon = (value) => {
    if (value <= 45) return <TrendingDown className="w-5 h-5" />;
    if (value <= 55) return <Minus className="w-5 h-5" />;
    return <TrendingUp className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <Card className="glass-morphism border-0">
        <CardContent className="p-6">
          <LoadingSpinner text="Carregando índice..." />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const value = parseInt(data.value);
  const classification = data.value_classification;

  return (
    <Card className="glass-morphism border-0 card-hover">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-400 mb-3">Índice de Medo e Ganância</div>
          
          {/* Gauge visual */}
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-700/30"
              />
              
              {/* Progress circle */}
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                className={getIndexColor(value)}
                initial={{ strokeDashoffset: 439.6 }}
                animate={{ strokeDashoffset: 439.6 - (439.6 * value) / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  strokeDasharray: 439.6
                }}
              />
            </svg>
            
            {/* Center value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className={`text-4xl font-bold ${getIndexColor(value)}`}
              >
                {value}
              </motion.div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>

          {/* Label and icon */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getIndexBgColor(value)}`}>
            <span className={getIndexColor(value)}>
              {getIndexIcon(value)}
            </span>
            <span className={`font-semibold ${getIndexColor(value)}`}>
              {getIndexLabel(value)}
            </span>
          </div>

          {/* Description */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              {value <= 25 && 'Investidores estão extremamente preocupados. Pode ser uma oportunidade de compra.'}
              {value > 25 && value <= 45 && 'Mercado com medo. Investidores cautelosos.'}
              {value > 45 && value <= 55 && 'Sentimento neutro. Mercado estável.'}
              {value > 55 && value <= 75 && 'Ganância crescente. Cuidado com correções.'}
              {value > 75 && 'Ganância extrema! Alto risco de correção.'}
            </p>
          </div>

          {/* Last update */}
          <div className="mt-3 text-xs text-gray-500">
            Atualizado: {new Date(parseInt(data.timestamp) * 1000).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FearGreedIndex;
