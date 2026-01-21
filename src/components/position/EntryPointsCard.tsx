import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, ArrowRightCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PositionEntry } from '@/services/positionAnalysis/types';

interface EntryPointsCardProps {
  entries: PositionEntry[];
  currency: string;
}

export function EntryPointsCard({ entries, currency }: EntryPointsCardProps) {
  const formatPrice = (value: number) => {
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;
    return `${symbol}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getEntryTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'pullback':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'rompimento':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'reteste':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getEntryTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'pullback':
        return <TrendingUp className="h-4 w-4" />;
      case 'rompimento':
        return <ArrowRightCircle className="h-4 w-4" />;
      case 'reteste':
        return <Target className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Target className="h-4 w-4" />
              Pontos de Entrada (Position Trade)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhum ponto de entrada ideal identificado no momento.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Aguarde pullbacks ou rompimentos com melhor R:R.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <Target className="h-4 w-4" />
            Pontos de Entrada (Position Trade)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map((entry, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="p-4 rounded-lg border border-border/50 bg-background/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getEntryTypeColor(entry.tipo)}`}>
                    {getEntryTypeIcon(entry.tipo)}
                    <span className="ml-1 capitalize">{entry.tipo}</span>
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    R:R {entry.rr.toFixed(1)}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">#{idx + 1}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Entrada</p>
                  <p className="text-sm font-semibold text-blue-400">
                    {formatPrice(entry.preco)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stop</p>
                  <p className="text-sm font-semibold text-red-400">
                    {formatPrice(entry.stop)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alvo</p>
                  <p className="text-sm font-semibold text-green-400">
                    {formatPrice(entry.alvo)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {entry.racional}
              </p>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
