import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SupportResistanceLevel } from '@/services/positionAnalysis/types';

interface LevelsTableProps {
  levels: SupportResistanceLevel[];
  currentPrice: number;
  currency: string;
}

export function LevelsTable({ levels, currentPrice, currency }: LevelsTableProps) {
  const supports = levels.filter(l => l.type === 'suporte');
  const resistances = levels.filter(l => l.type === 'resistência');

  const formatPrice = (value: number) => {
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;
    return `${symbol}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDistancePercent = (price: number) => {
    const distance = ((price - currentPrice) / currentPrice) * 100;
    return distance.toFixed(2);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'forte':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'média':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getOriginIcon = (origin: string) => {
    switch (origin) {
      case 'pivô':
        return '📍';
      case 'fibonacci':
        return '🔢';
      case 'média móvel':
        return '📊';
      default:
        return '•';
    }
  };

  const LevelRow = ({ level, type }: { level: SupportResistanceLevel; type: 'suporte' | 'resistência' }) => (
    <motion.div
      initial={{ opacity: 0, x: type === 'suporte' ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-3 rounded-lg border ${
        type === 'suporte' 
          ? 'bg-green-500/5 border-green-500/20' 
          : 'bg-red-500/5 border-red-500/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{getOriginIcon(level.origin)}</span>
        <div>
          <p className="font-semibold">{formatPrice(level.price)}</p>
          <p className="text-xs text-muted-foreground capitalize">{level.origin}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${type === 'suporte' ? 'text-green-400' : 'text-red-400'}`}>
          {getDistancePercent(level.price)}%
        </span>
        <Badge variant="outline" className={`text-xs ${getStrengthColor(level.strength)}`}>
          {level.strength}
        </Badge>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <Layers className="h-4 w-4" />
            Suportes & Resistências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">Todos ({levels.length})</TabsTrigger>
              <TabsTrigger value="supports" className="text-green-400">
                <ArrowDown className="h-3 w-3 mr-1" />
                Suportes ({supports.length})
              </TabsTrigger>
              <TabsTrigger value="resistances" className="text-red-400">
                <ArrowUp className="h-3 w-3 mr-1" />
                Resistências ({resistances.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {levels.slice(0, 8).map((level, idx) => (
                <LevelRow key={idx} level={level} type={level.type} />
              ))}
            </TabsContent>

            <TabsContent value="supports" className="space-y-2">
              {supports.map((level, idx) => (
                <LevelRow key={idx} level={level} type="suporte" />
              ))}
              {supports.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum suporte identificado
                </p>
              )}
            </TabsContent>

            <TabsContent value="resistances" className="space-y-2">
              {resistances.map((level, idx) => (
                <LevelRow key={idx} level={level} type="resistência" />
              ))}
              {resistances.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma resistência identificada
                </p>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-3 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              Preço atual: <span className="font-medium text-foreground">{formatPrice(currentPrice)}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
