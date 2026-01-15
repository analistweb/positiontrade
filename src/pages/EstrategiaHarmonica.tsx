import { useHarmonicBacktest } from '@/hooks/useHarmonicBacktest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Play, TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';

export default function EstrategiaHarmonica() {
  const { isLoading, progress, backtest, monteCarlo, validation, error, dataInfo, runBacktest } = useHarmonicBacktest();

  const getStatusIcon = (passed: boolean) => passed 
    ? <CheckCircle className="h-4 w-4 text-green-500" /> 
    : <XCircle className="h-4 w-4 text-red-500" />;

  const getVerdictBadge = () => {
    if (!validation) return null;
    const colors = {
      'APROVADA': 'bg-green-500/20 text-green-400 border-green-500/50',
      'QUASE': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'REPROVADA': 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    const icons = {
      'APROVADA': <CheckCircle className="h-5 w-5" />,
      'QUASE': <AlertTriangle className="h-5 w-5" />,
      'REPROVADA': <XCircle className="h-5 w-5" />
    };
    return (
      <Badge className={`${colors[validation.status]} text-lg px-4 py-2 gap-2`}>
        {icons[validation.status]} {validation.status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Estratégia Harmônica ETHUSDT</h1>
          <p className="text-muted-foreground">Padrões XABCD com filtro EMA200 H4, backtest e Monte Carlo</p>
        </div>

        {/* Botão Executar */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <Button onClick={() => runBacktest()} disabled={isLoading} size="lg" className="gap-2">
                <Play className="h-5 w-5" /> {isLoading ? 'Executando...' : 'Executar Backtest'}
              </Button>
              {isLoading && (
                <div className="w-full max-w-md space-y-2">
                  <Progress value={undefined} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">{progress}</p>
                </div>
              )}
              {error && <p className="text-red-500">{error}</p>}
              {dataInfo && !isLoading && <p className="text-sm text-muted-foreground">{dataInfo}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Veredicto */}
        {validation && (
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-4">
                Decisão Final: {getVerdictBadge()}
              </CardTitle>
              <p className="text-muted-foreground">{validation.passedCount}/{validation.totalCriteria} critérios atendidos</p>
            </CardHeader>
          </Card>
        )}

        {/* Métricas do Backtest */}
        {backtest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{backtest.totalTrades}</p>
                <p className="text-sm text-muted-foreground">Total Trades</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{(backtest.winRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{backtest.profitFactor.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Profit Factor</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{(backtest.maxDrawdown * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Critérios de Validação */}
        {validation && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Critérios de Validação</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(validation.criteria).map(([key, c]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(c.passed)}
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <span className={c.passed ? 'text-green-500' : 'text-red-500'}>
                      {typeof c.value === 'number' ? c.value.toFixed(2) : c.value} (min: {c.threshold})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monte Carlo */}
        {monteCarlo && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Monte Carlo (1000 simulações)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold">${monteCarlo.median.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Mediana</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">${monteCarlo.worst5Percent.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Pior 5%</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">${monteCarlo.best5Percent.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Melhor 5%</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{(monteCarlo.riskOfRuin * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Risco de Ruína</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
