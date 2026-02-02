import React from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';

const FearGreedIndex = ({ variant = 'default' }) => {
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

  // Compact variant for LiveCryptoHero
  if (variant === 'compact') {
    if (isLoading) {
      return (
        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-white/10 rounded w-20 mb-2" />
            <div className="h-8 bg-white/10 rounded w-16" />
          </div>
        </div>
      );
    }

    if (!data) return null;
    const value = parseInt(data.value);

    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <span className={getIndexColor(value)}>
              {getIndexIcon(value)}
            </span>
            <span className="text-xs text-white/50 uppercase tracking-wider">F&G</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={cn("text-xl md:text-2xl font-bold", getIndexColor(value))}>
              {value}
            </p>
            <span className={cn("text-xs", getIndexColor(value))}>
              {getIndexLabel(value)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
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
