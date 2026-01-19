import { useHarmonicBacktest } from '@/hooks/useHarmonicBacktest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Play, TrendingUp, TrendingDown, Target, Shield, Percent, DollarSign, BarChart3, Activity, Info } from 'lucide-react';
import { SignalStatusCard, PatternDetailsCard, EquityCurveChart, TradesTable } from '@/components/harmonic';

export default function EstrategiaHarmonica() {
  const { isLoading, progress, backtest, monteCarlo, validation, error, dataInfo, stats, runBacktest } = useHarmonicBacktest();

  // Extrai o último padrão e níveis dos trades
  const lastTrade = backtest?.trades?.[backtest.trades.length - 1];
  const lastPattern = lastTrade ? null : null; // Pattern não está exposto diretamente nos trades

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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Estratégia Harmônica ETHUSDT</h1>
          <p className="text-muted-foreground text-sm md:text-base">Padrões XABCD com filtro EMA200 H4, backtest determinístico e Monte Carlo</p>
        </div>

        {/* Botão Executar + Sinal Atual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Button onClick={() => runBacktest()} disabled={isLoading} size="lg" className="gap-2 w-full md:w-auto">
                  <Play className="h-5 w-5" /> {isLoading ? 'Executando...' : 'Executar Backtest'}
                </Button>
                {isLoading && (
                  <div className="w-full space-y-2">
                    <Progress value={undefined} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">{progress}</p>
                  </div>
                )}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {dataInfo && !isLoading && <p className="text-xs text-muted-foreground text-center">{dataInfo}</p>}
              </div>
            </CardContent>
          </Card>

          <SignalStatusCard 
            lastPattern={lastPattern} 
            hasActiveTrade={false}
          />
        </div>

        {/* Estatísticas de Detecção */}
        {stats && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Diagnóstico de Detecção
              </CardTitle>
              <CardDescription>Pipeline de identificação de padrões harmônicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-primary">{stats.swingsDetected}</p>
                  <p className="text-xs text-muted-foreground">Swings Detectados</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-blue-400">{stats.patternsFound}</p>
                  <p className="text-xs text-muted-foreground">Padrões Encontrados</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-green-400">{stats.patternsAligned}</p>
                  <p className="text-xs text-muted-foreground">Alinhados c/ Tendência</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-yellow-400">{stats.patternsTraded}</p>
                  <p className="text-xs text-muted-foreground">Trades Executados</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 text-center">
                  <p className="text-xl font-bold text-red-400">{stats.rejectedByTrend}</p>
                  <p className="text-xs text-muted-foreground">Rejeitados (Tendência)</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 text-center">
                  <p className="text-xl font-bold text-red-400">{stats.rejectedByRisk}</p>
                  <p className="text-xs text-muted-foreground">Rejeitados (Risco)</p>
                </div>
              </div>
              
              {stats.patternsFound === 0 && stats.swingsDetected > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                  <Info className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-400">Nenhum padrão harmônico detectado</p>
                    <p className="text-muted-foreground mt-1">
                      {stats.swingsDetected} swings foram identificados, mas nenhuma sequência XABCD válida foi encontrada.
                      Isso pode indicar que o mercado não formou padrões harmônicos claros no período analisado,
                      ou que as regras de geometria Fibonacci estão muito restritivas.
                    </p>
                  </div>
                </div>
              )}
              
              {stats.swingsDetected < 10 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                  <Info className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-400">Poucos swings detectados</p>
                    <p className="text-muted-foreground mt-1">
                      Apenas {stats.swingsDetected} swings foram identificados. Padrões harmônicos requerem
                      pelo menos 5 swings consecutivos alternados. Verifique se os dados históricos estão completos.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Veredicto */}
        {validation && (
          <Card className="bg-card border-border">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex flex-col md:flex-row items-center justify-center gap-4">
                <span>Decisão Final:</span>
                {getVerdictBadge()}
              </CardTitle>
              <p className="text-muted-foreground text-sm">{validation.passedCount}/{validation.totalCriteria} critérios atendidos</p>
            </CardHeader>
          </Card>
        )}

        {/* Métricas do Backtest - Grid expandido */}
        {backtest && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Target className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-xl md:text-2xl font-bold">{backtest.totalTrades}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <p className="text-xl md:text-2xl font-bold">{(backtest.winRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Shield className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <p className="text-xl md:text-2xl font-bold">{backtest.profitFactor.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Profit Factor</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-5 w-5 mx-auto mb-2 text-red-500" />
                <p className="text-xl md:text-2xl font-bold">{(backtest.maxDrawdown * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Percent className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                <p className="text-xl md:text-2xl font-bold">{backtest.expectancy.toFixed(2)}R</p>
                <p className="text-xs text-muted-foreground">Expectancy</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                <p className="text-xl md:text-2xl font-bold">${backtest.finalCapital.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Capital Final</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico de Capital */}
        {backtest && (
          <EquityCurveChart 
            capitalCurve={backtest.capitalCurve} 
            initialCapital={10000}
          />
        )}

        {/* Critérios de Validação */}
        {validation && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Critérios de Validação</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(validation.criteria).map(([key, c]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(c.passed)}
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <span className={`text-sm font-mono ${c.passed ? 'text-green-500' : 'text-red-500'}`}>
                      {typeof c.value === 'number' ? c.value.toFixed(2) : c.value}
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
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-lg md:text-xl font-bold">${monteCarlo.median.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Mediana</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <p className="text-lg md:text-xl font-bold text-red-400">${monteCarlo.worst5Percent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Pior 5%</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-lg md:text-xl font-bold text-green-400">${monteCarlo.best5Percent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Melhor 5%</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                <p className="text-lg md:text-xl font-bold text-yellow-400">{(monteCarlo.riskOfRuin * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Risco de Ruína</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <p className="text-xs font-mono text-blue-400">
                  ${monteCarlo.confidenceInterval95[0].toFixed(0)} - ${monteCarlo.confidenceInterval95[1].toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">IC 95%</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Trades */}
        {backtest && (
          <TradesTable trades={backtest.trades} />
        )}
      </div>
    </div>
  );
}
