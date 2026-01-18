import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, TrendingUp, TrendingDown } from 'lucide-react';
import type { Trade } from '@/services/harmonic/types';

interface TradesTableProps {
  trades: Trade[];
}

export function TradesTable({ trades }: TradesTableProps) {
  if (!trades || trades.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-primary" />
            Histórico de Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            Nenhum trade executado. Execute o backtest para ver o histórico.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExitReasonLabel = (reason: Trade['exitReason']) => {
    const labels = {
      tp1: 'TP1',
      tp2: 'TP2',
      trailing: 'Trailing',
      sl: 'Stop Loss'
    };
    return labels[reason];
  };

  const getExitReasonColor = (reason: Trade['exitReason']) => {
    if (reason === 'sl') return 'bg-red-500/20 text-red-400';
    if (reason === 'trailing') return 'bg-blue-500/20 text-blue-400';
    return 'bg-green-500/20 text-green-400';
  };

  // Ordena trades por data de entrada (mais recentes primeiro)
  const sortedTrades = [...trades].sort((a, b) => b.entryTime - a.entryTime);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <List className="h-5 w-5 text-primary" />
            Histórico de Trades
          </span>
          <Badge variant="outline">{trades.length} trades</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Tipo</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead className="text-right">Preço E.</TableHead>
                <TableHead className="text-right">Preço S.</TableHead>
                <TableHead className="text-center">Motivo</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrades.map((trade, idx) => (
                <TableRow key={trade.id || idx}>
                  <TableCell>
                    {trade.type === 'buy' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(trade.entryTime)}</TableCell>
                  <TableCell className="text-xs">{formatDate(trade.exitTime)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    ${trade.entryPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    ${trade.exitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${getExitReasonColor(trade.exitReason)}`}>
                      {getExitReasonLabel(trade.exitReason)}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold ${trade.profitR > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.profitR > 0 ? '+' : ''}{trade.profitR.toFixed(2)}R
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
