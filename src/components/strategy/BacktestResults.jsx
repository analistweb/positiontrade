import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Activity,
  BarChart3,
  Percent,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'default' }) => {
  const colorClasses = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    yellow: 'text-amber-400',
    blue: 'text-blue-400',
    default: 'text-foreground'
  };

  return (
    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className={`text-lg font-bold ${colorClasses[color]}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      )}
    </div>
  );
};

const BacktestResults = ({ backtestResult, monteCarloResult }) => {
  if (!backtestResult) return null;

  const { metrics, trades, period, initialCapital, finalCapital, signals } = backtestResult;
  
  const returnColor = metrics.totalReturn >= 0 ? 'green' : 'red';
  const winRateColor = metrics.winRate >= 50 ? 'green' : metrics.winRate >= 40 ? 'yellow' : 'red';
  const profitFactorColor = metrics.profitFactor >= 1.5 ? 'green' : metrics.profitFactor >= 1 ? 'yellow' : 'red';
  const drawdownColor = metrics.maxDrawdown <= 10 ? 'green' : metrics.maxDrawdown <= 20 ? 'yellow' : 'red';

  return (
    <div className="space-y-4">
      {/* Header com resumo */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resultado do Backtest
            </CardTitle>
            <Badge variant={metrics.totalReturn >= 0 ? 'default' : 'destructive'}>
              {metrics.totalReturn >= 0 ? '✓ Lucrativo' : '✗ Prejuízo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Período e Trades */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span>
              Período: {new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>{period.candles} candles</span>
            <span>•</span>
            <span>{metrics.totalTrades} trades</span>
          </div>

          {/* KPIs principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard
              title="Retorno Total"
              value={`${metrics.totalReturn > 0 ? '+' : ''}${metrics.totalReturn}%`}
              subtitle={`$${initialCapital.toLocaleString()} → $${Math.round(finalCapital).toLocaleString()}`}
              icon={metrics.totalReturn >= 0 ? TrendingUp : TrendingDown}
              color={returnColor}
            />
            <MetricCard
              title="Win Rate"
              value={`${metrics.winRate}%`}
              subtitle={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
              icon={Target}
              color={winRateColor}
            />
            <MetricCard
              title="Profit Factor"
              value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
              subtitle={`$${metrics.totalWins} / $${metrics.totalLosses}`}
              icon={Activity}
              color={profitFactorColor}
            />
            <MetricCard
              title="Max Drawdown"
              value={`-${metrics.maxDrawdown}%`}
              subtitle="Perda máxima do pico"
              icon={AlertTriangle}
              color={drawdownColor}
            />
          </div>

          {/* Métricas secundárias */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="text-center p-2 bg-background/30 rounded">
              <div className="text-xs text-muted-foreground">Média Win</div>
              <div className="text-sm font-medium text-emerald-400">+{metrics.averageWin}%</div>
            </div>
            <div className="text-center p-2 bg-background/30 rounded">
              <div className="text-xs text-muted-foreground">Média Loss</div>
              <div className="text-sm font-medium text-red-400">-{metrics.averageLoss}%</div>
            </div>
            <div className="text-center p-2 bg-background/30 rounded">
              <div className="text-xs text-muted-foreground">Expectativa</div>
              <div className={`text-sm font-medium ${metrics.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {metrics.expectancy > 0 ? '+' : ''}{metrics.expectancy}%
              </div>
            </div>
            <div className="text-center p-2 bg-background/30 rounded">
              <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
              <div className="text-sm font-medium">{metrics.sharpeRatio}</div>
            </div>
            <div className="text-center p-2 bg-background/30 rounded">
              <div className="text-xs text-muted-foreground">Sequência Win</div>
              <div className="text-sm font-medium text-emerald-400">{metrics.maxConsecutiveWins}</div>
            </div>
            <div className="text-center p-2 bg-background/30 rounded">
              <div className="text-xs text-muted-foreground">Sequência Loss</div>
              <div className="text-sm font-medium text-red-400">{metrics.maxConsecutiveLosses}</div>
            </div>
          </div>

          {/* Sinais */}
          <div className="mt-4 p-3 bg-background/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">Eficiência de Sinais</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={(signals.executed / signals.generated) * 100} className="h-2" />
              </div>
              <div className="text-xs">
                {signals.executed}/{signals.generated} executados ({signals.rejected} rejeitados)
              </div>
            </div>
          </div>

          {/* Breakdown por direção */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium">Compras</span>
              </div>
              <div className="text-lg font-bold text-emerald-400">{metrics.buyWinRate}%</div>
              <div className="text-xs text-muted-foreground">{metrics.buyTrades} trades</div>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium">Vendas</span>
              </div>
              <div className="text-lg font-bold text-red-400">{metrics.sellWinRate}%</div>
              <div className="text-xs text-muted-foreground">{metrics.sellTrades} trades</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monte Carlo Results */}
      {monteCarloResult && (
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Simulação Monte Carlo
              <Badge variant="outline" className="ml-2">
                {monteCarloResult.summary.numSimulations} simulações
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Resumo de Retornos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard
                title="Retorno Médio"
                value={`${monteCarloResult.returns.mean > 0 ? '+' : ''}${monteCarloResult.returns.mean}%`}
                subtitle={`Mediana: ${monteCarloResult.returns.median}%`}
                icon={BarChart3}
                color={monteCarloResult.returns.mean >= 0 ? 'green' : 'red'}
              />
              <MetricCard
                title="Pior Cenário (5%)"
                value={`${monteCarloResult.returns.percentiles.p5}%`}
                subtitle="Value at Risk 95%"
                icon={AlertTriangle}
                color="red"
              />
              <MetricCard
                title="Melhor Cenário (95%)"
                value={`+${monteCarloResult.returns.percentiles.p95}%`}
                subtitle="Cenário otimista"
                icon={TrendingUp}
                color="green"
              />
              <MetricCard
                title="Drawdown Esperado"
                value={`-${monteCarloResult.drawdown.mean}%`}
                subtitle={`Pior: -${monteCarloResult.drawdown.worst}%`}
                icon={TrendingDown}
                color="yellow"
              />
            </div>

            {/* Probabilidades */}
            <div className="bg-background/30 rounded-lg p-4 mb-4">
              <div className="text-sm font-medium mb-3">Análise de Probabilidade</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {monteCarloResult.risk.probProfit}%
                  </div>
                  <div className="text-xs text-muted-foreground">Chance de Lucro</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {monteCarloResult.risk.probRuin}%
                  </div>
                  <div className="text-xs text-muted-foreground">Risco de Ruína</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {monteCarloResult.risk.probDoubling}%
                  </div>
                  <div className="text-xs text-muted-foreground">Chance de Dobrar</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {monteCarloResult.ratios.sortinoRatio}
                  </div>
                  <div className="text-xs text-muted-foreground">Sortino Ratio</div>
                </div>
              </div>
            </div>

            {/* Win Rate Confidence */}
            {monteCarloResult.winRateBootstrap && (
              <div className="bg-background/30 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Intervalo de Confiança do Win Rate (95%)</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-primary/30"
                        style={{ 
                          left: `${monteCarloResult.winRateBootstrap.confidence95.lower}%`,
                          width: `${monteCarloResult.winRateBootstrap.confidence95.upper - monteCarloResult.winRateBootstrap.confidence95.lower}%`
                        }}
                      />
                      <div 
                        className="absolute h-full w-1 bg-primary"
                        style={{ left: `${monteCarloResult.winRateBootstrap.mean}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{monteCarloResult.winRateBootstrap.confidence95.lower}%</span>
                      <span className="font-medium">{monteCarloResult.winRateBootstrap.mean}%</span>
                      <span>{monteCarloResult.winRateBootstrap.confidence95.upper}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Distribuição visual */}
            {monteCarloResult.distribution && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Distribuição de Resultados</div>
                <div className="flex items-end gap-1 h-20">
                  {monteCarloResult.distribution.frequencies.map((freq, idx) => {
                    const maxFreq = Math.max(...monteCarloResult.distribution.frequencies);
                    const height = (freq / maxFreq) * 100;
                    const isNegative = monteCarloResult.distribution.labels[idx].includes('-');
                    
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t ${isNegative ? 'bg-red-500/60' : 'bg-emerald-500/60'}`}
                        style={{ height: `${height}%` }}
                        title={`${monteCarloResult.distribution.labels[idx]}: ${freq}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{monteCarloResult.returns.min}%</span>
                  <span>0%</span>
                  <span>+{monteCarloResult.returns.max}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BacktestResults;
