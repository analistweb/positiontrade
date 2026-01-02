import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  PlayCircle, 
  Settings2, 
  RefreshCw, 
  ChevronDown,
  Calendar,
  DollarSign,
  Percent,
  Activity
} from 'lucide-react';
import useBacktest from '@/hooks/useBacktest';
import BacktestResults from './BacktestResults';

const BacktestPanel = ({ symbol = 'ETHUSDT' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState({
    days: 30,
    initialCapital: 10000,
    riskPerTrade: 2,
    numSimulations: 1000
  });

  const {
    isRunning,
    progress,
    backtestResult,
    monteCarloResult,
    error,
    runFullAnalysis,
    reset
  } = useBacktest(symbol);

  const handleRun = () => {
    runFullAnalysis({
      days: config.days,
      initialCapital: config.initialCapital,
      riskPerTrade: config.riskPerTrade / 100,
      numSimulations: config.numSimulations
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/80 border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Backtest & Simulação Monte Carlo
                {backtestResult && (
                  <Badge 
                    variant={backtestResult.metrics.totalReturn >= 0 ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {backtestResult.metrics.totalReturn >= 0 ? '+' : ''}{backtestResult.metrics.totalReturn}%
                  </Badge>
                )}
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Configurações */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Dias
                </Label>
                <Input
                  type="number"
                  value={config.days}
                  onChange={(e) => setConfig({ ...config, days: parseInt(e.target.value) || 30 })}
                  min={7}
                  max={365}
                  className="h-8"
                  disabled={isRunning}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Capital Inicial
                </Label>
                <Input
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => setConfig({ ...config, initialCapital: parseInt(e.target.value) || 10000 })}
                  min={100}
                  step={1000}
                  className="h-8"
                  disabled={isRunning}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Risco/Trade (%)
                </Label>
                <Input
                  type="number"
                  value={config.riskPerTrade}
                  onChange={(e) => setConfig({ ...config, riskPerTrade: parseFloat(e.target.value) || 2 })}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="h-8"
                  disabled={isRunning}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Simulações MC
                </Label>
                <Input
                  type="number"
                  value={config.numSimulations}
                  onChange={(e) => setConfig({ ...config, numSimulations: parseInt(e.target.value) || 1000 })}
                  min={100}
                  max={10000}
                  step={100}
                  className="h-8"
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRun} 
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Executar Backtest
                  </>
                )}
              </Button>
              
              {backtestResult && !isRunning && (
                <Button variant="outline" onClick={reset}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress bar */}
            {isRunning && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {progress < 30 && 'Buscando dados históricos...'}
                  {progress >= 30 && progress < 60 && 'Executando backtest...'}
                  {progress >= 60 && progress < 100 && 'Simulação Monte Carlo...'}
                  {progress === 100 && 'Concluído!'}
                </div>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Resultados */}
            {backtestResult && !isRunning && (
              <BacktestResults 
                backtestResult={backtestResult}
                monteCarloResult={monteCarloResult}
              />
            )}

            {/* Explicação do que é Monte Carlo */}
            {!backtestResult && !isRunning && (
              <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-2">O que este teste faz?</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Backtest:</strong> Simula a estratégia em dados históricos reais</li>
                  <li>• <strong>Monte Carlo:</strong> Executa {config.numSimulations} simulações aleatórias para calcular probabilidades estatísticas</li>
                  <li>• <strong>Win Rate:</strong> Intervalo de confiança real da taxa de acerto</li>
                  <li>• <strong>Risco de Ruína:</strong> Probabilidade de perder mais de 50% do capital</li>
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default BacktestPanel;
