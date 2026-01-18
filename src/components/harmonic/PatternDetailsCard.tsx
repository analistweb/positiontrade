import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hexagon, Target, Shield } from 'lucide-react';
import type { HarmonicPattern } from '@/services/harmonic/types';

interface PatternDetailsCardProps {
  pattern: HarmonicPattern | null;
  tp1?: number;
  tp2?: number;
  sl?: number;
}

export function PatternDetailsCard({ pattern, tp1, tp2, sl }: PatternDetailsCardProps) {
  if (!pattern) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-primary" />
            Último Padrão Detectado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            Nenhum padrão detectado ainda. Execute o backtest para analisar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number) => price.toFixed(2);
  const formatRatio = (ratio: number) => (ratio * 100).toFixed(1) + '%';

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-primary" />
            Último Padrão Detectado
          </span>
          <Badge className={pattern.type === 'bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
            {pattern.patternName} - {pattern.type === 'bullish' ? 'Bullish' : 'Bearish'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pontos XABCD */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Pontos XABCD</h4>
          <div className="grid grid-cols-5 gap-2">
            {(['X', 'A', 'B', 'C', 'D'] as const).map((point) => (
              <div key={point} className="text-center p-2 rounded-lg bg-muted/50">
                <span className="text-lg font-bold text-primary">{point}</span>
                <p className="text-xs text-foreground">${formatPrice(pattern.points[point].price)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ratios de Fibonacci */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Ratios de Fibonacci</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span>AB/XA:</span>
              <span className="font-mono">{formatRatio(pattern.ratios.AB_XA)}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span>BC/AB:</span>
              <span className="font-mono">{formatRatio(pattern.ratios.BC_AB)}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span>CD/BC:</span>
              <span className="font-mono">{formatRatio(pattern.ratios.CD_BC)}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span>D/XA:</span>
              <span className="font-mono">{formatRatio(pattern.ratios.D_XA)}</span>
            </div>
          </div>
        </div>

        {/* Níveis de TP e SL */}
        {(tp1 || tp2 || sl) && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Níveis de Trade</h4>
            <div className="grid grid-cols-3 gap-2">
              {tp1 && (
                <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Target className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-green-400">TP1 (38.2%)</p>
                  <p className="text-sm font-mono">${formatPrice(tp1)}</p>
                </div>
              )}
              {tp2 && (
                <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Target className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-green-400">TP2 (61.8%)</p>
                  <p className="text-sm font-mono">${formatPrice(tp2)}</p>
                </div>
              )}
              {sl && (
                <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <Shield className="h-4 w-4 mx-auto mb-1 text-red-500" />
                  <p className="text-xs text-red-400">Stop Loss</p>
                  <p className="text-sm font-mono">${formatPrice(sl)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Simetria Temporal */}
        <div className="text-xs text-muted-foreground flex justify-between border-t border-border pt-2">
          <span>Simetria CD/AB: {pattern.temporalSymmetry.CD_AB_ratio.toFixed(2)}x</span>
          <span>BC/AB: {pattern.temporalSymmetry.BC_AB_ratio.toFixed(2)}x</span>
          <Badge variant={pattern.temporalSymmetry.valid ? 'default' : 'destructive'} className="text-xs">
            {pattern.temporalSymmetry.valid ? 'Válida' : 'Inválida'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
