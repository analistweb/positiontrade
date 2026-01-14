import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, BarChart3, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAsymmetricBacktest } from '@/hooks/useAsymmetricBacktest';

export default function AsymmetricEdgeTest() {
  const {
    isLoading,
    progress,
    progressMessage,
    backtestResult,
    monteCarloResult,
    config,
    setConfig,
    runBacktest,
    reset
  } = useAsymmetricBacktest();

  const handleTrailingChange = (value: number[]) => {
    setConfig({ ...config, trailingATRMultiplier: value[0] });
  };

  const handleSwingSensitivityChange = (value: number[]) => {
    setConfig({ ...config, swingSensitivity: value[0] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADO': return 'bg-green-500';
      case 'QUASE': return 'bg-yellow-500';
      case 'REPROVADO': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADO': return <CheckCircle className="h-6 w-6" />;
      case 'QUASE': return <AlertTriangle className="h-6 w-6" />;
      case 'REPROVADO': return <XCircle className="h-6 w-6" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            ASYMMETRIC EDGE V2
          </h1>
          <p className="text-muted-foreground">
            Backtest com Trailing Estrutural • Sem TP Fixo • Validação Estatística
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Parâmetros Ajustáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Trailing ATR Multiplier: {config.trailingATRMultiplier.toFixed(1)}x
                </label>
                <Slider
                  value={[config.trailingATRMultiplier]}
                  onValueChange={handleTrailingChange}
                  min={0.5}
                  max={3}
                  step={0.1}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Distância do trailing stop em relação ao último swing
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Sensibilidade de Swing: {config.swingSensitivity} barras
                </label>
                <Slider
                  value={[config.swingSensitivity]}
                  onValueChange={handleSwingSensitivityChange}
                  min={3}
                  max={10}
                  step={1}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Número de barras para confirmar swing high/low
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => runBacktest('ETHUSDT')}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>Executando...</>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Backtest ETHUSDT M15
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={reset} disabled={isLoading}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">{progressMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {backtestResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Validation Status */}
            <Card className={`border-2 ${
              backtestResult.validation.overallStatus === 'APROVADO' ? 'border-green-500' :
              backtestResult.validation.overallStatus === 'QUASE' ? 'border-yellow-500' : 'border-red-500'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  <div className={`p-3 rounded-full text-white ${getStatusColor(backtestResult.validation.overallStatus)}`}>
                    {getStatusIcon(backtestResult.validation.overallStatus)}
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{backtestResult.validation.overallStatus}</h2>
                    <p className="text-muted-foreground">
                      {backtestResult.validation.overallStatus === 'APROVADO' 
                        ? 'Esta estratégia merece capital real'
                        : backtestResult.validation.overallStatus === 'QUASE'
                        ? 'Necessita ajustes antes de usar capital real'
                        : 'NÃO usar capital real nesta estratégia'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                  {backtestResult.validation.details.map((detail, i) => (
                    <Badge key={i} variant={detail.includes('✓') ? 'default' : 'destructive'} className="justify-center py-1">
                      {detail}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{backtestResult.metrics.totalTrades}</p>
                  <p className="text-xs text-muted-foreground">Total Trades</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{(backtestResult.metrics.winRate * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{backtestResult.metrics.profitFactor.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Profit Factor</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{backtestResult.metrics.expectancy.toFixed(3)}R</p>
                  <p className="text-xs text-muted-foreground">Expectativa</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{backtestResult.metrics.avgWin.toFixed(2)}R</p>
                  <p className="text-xs text-muted-foreground">Avg Win</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{backtestResult.metrics.avgLoss.toFixed(2)}R</p>
                  <p className="text-xs text-muted-foreground">Avg Loss</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{backtestResult.metrics.maxDrawdownPercent.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Max Drawdown</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{backtestResult.metrics.sharpeRatio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                </CardContent>
              </Card>
            </div>

            {/* Kelly Fraction */}
            <Card>
              <CardHeader>
                <CardTitle>Kelly Fraction (Gestão de Risco)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold">{(backtestResult.metrics.kellyFraction * 100).toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Kelly Ótimo</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-primary">{(backtestResult.metrics.conservativeKelly * 100).toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Kelly Conservador (25%)</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{backtestResult.metrics.maxRiskPerTrade.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Risco Máximo/Trade</p>
                </div>
              </CardContent>
            </Card>

            {/* Monte Carlo */}
            {monteCarloResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Monte Carlo ({monteCarloResult.simulations} simulações)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">{monteCarloResult.median.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Mediana</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-500">{monteCarloResult.worst5Percent.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Worst 5%</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-500">{monteCarloResult.best5Percent.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Best 5%</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{(monteCarloResult.ruinProbability * 100).toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Risco de Ruína</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Return */}
            <Card>
              <CardContent className="pt-6 text-center">
                <p className={`text-4xl font-bold ${backtestResult.metrics.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {backtestResult.metrics.totalReturn >= 0 ? '+' : ''}{backtestResult.metrics.totalReturn.toFixed(2)}%
                </p>
                <p className="text-muted-foreground">Retorno Total (Capital Inicial: $10,000)</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
