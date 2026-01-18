import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { generateUserSignals } from '@/services/harmonic/monteCarloSimulation';
import type { HarmonicPattern } from '@/services/harmonic/types';

interface SignalStatusCardProps {
  lastPattern: HarmonicPattern | null;
  hasActiveTrade: boolean;
}

export function SignalStatusCard({ lastPattern, hasActiveTrade }: SignalStatusCardProps) {
  const signal = generateUserSignals(
    !!lastPattern,
    lastPattern?.type || null,
    hasActiveTrade
  );

  const statusConfig = {
    waiting: {
      icon: Clock,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      bgGlow: 'shadow-yellow-500/20',
      label: 'Aguarde Entrada'
    },
    buy: {
      icon: TrendingUp,
      color: 'bg-green-500/20 text-green-400 border-green-500/50',
      bgGlow: 'shadow-green-500/20',
      label: 'Compra Detectada'
    },
    sell: {
      icon: TrendingDown,
      color: 'bg-red-500/20 text-red-400 border-red-500/50',
      bgGlow: 'shadow-red-500/20',
      label: 'Venda Detectada'
    },
    managing: {
      icon: Activity,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      bgGlow: 'shadow-blue-500/20',
      label: 'Em Gestão'
    }
  };

  const config = statusConfig[signal.status];
  const Icon = config.icon;

  return (
    <Card className={`bg-card border-border shadow-lg ${config.bgGlow}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Sinal Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <Badge className={`${config.color} text-xl px-6 py-3 gap-3`}>
            <Icon className="h-6 w-6" />
            {config.label}
          </Badge>
        </div>
        <p className="text-center text-muted-foreground text-sm">
          {signal.message}
        </p>
        {lastPattern && (
          <div className="text-center text-xs text-muted-foreground">
            Último padrão: {lastPattern.patternName} ({lastPattern.type})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
