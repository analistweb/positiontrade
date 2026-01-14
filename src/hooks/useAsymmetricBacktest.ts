/**
 * Hook para executar backtest ASYMMETRIC_EDGE_V2
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  runAsymmetricBacktest,
  runMonteCarloSimulation,
  updateValidationWithMonteCarlo,
  fetchHistoricalCandles,
  validateDataSufficiency,
  DEFAULT_CONFIG,
  type BacktestResult,
  type MonteCarloResult,
  type AsymmetricConfig,
  type Candle
} from '@/services/asymmetric';

export interface UseAsymmetricBacktestReturn {
  isLoading: boolean;
  progress: number;
  progressMessage: string;
  backtestResult: BacktestResult | null;
  monteCarloResult: MonteCarloResult | null;
  candles: Candle[];
  config: AsymmetricConfig;
  setConfig: (config: AsymmetricConfig) => void;
  runBacktest: (symbol?: string) => Promise<void>;
  reset: () => void;
}

export function useAsymmetricBacktest(): UseAsymmetricBacktestReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [config, setConfig] = useState<AsymmetricConfig>(DEFAULT_CONFIG);

  const runBacktest = useCallback(async (symbol: string = 'ETHUSDT') => {
    setIsLoading(true);
    setProgress(0);
    setProgressMessage('Iniciando...');
    setBacktestResult(null);
    setMonteCarloResult(null);
    setCandles([]);

    try {
      // Step 1: Fetch historical data
      setProgress(10);
      setProgressMessage('Buscando dados históricos da Binance...');
      
      const historicalCandles = await fetchHistoricalCandles(symbol, '15m');
      setCandles(historicalCandles);
      
      // Step 2: Validate data sufficiency
      setProgress(30);
      setProgressMessage('Validando quantidade de dados...');
      
      const validation = validateDataSufficiency(historicalCandles, '15m');
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      toast.info(`Dados carregados: ${validation.stats.days.toFixed(0)} dias, ${validation.stats.candles} candles`);
      
      // Step 3: Run backtest
      setProgress(50);
      setProgressMessage('Executando backtest ASYMMETRIC_EDGE_V2...');
      
      const result = runAsymmetricBacktest(historicalCandles, config);
      
      if (result.trades.length === 0) {
        toast.warning('Nenhum trade gerado. Verifique os parâmetros.');
      }
      
      setBacktestResult(result);
      
      // Step 4: Run Monte Carlo
      setProgress(75);
      setProgressMessage(`Executando Monte Carlo (1000 simulações)...`);
      
      const mcResult = runMonteCarloSimulation(result.trades, 1000);
      setMonteCarloResult(mcResult);
      
      // Step 5: Update validation with Monte Carlo
      setProgress(90);
      setProgressMessage('Validando critérios...');
      
      const finalValidation = updateValidationWithMonteCarlo(result.validation, mcResult);
      setBacktestResult(prev => prev ? { ...prev, validation: finalValidation } : null);
      
      // Complete
      setProgress(100);
      setProgressMessage('Completo!');
      
      // Show result toast
      if (finalValidation.overallStatus === 'APROVADO') {
        toast.success('🎉 Estratégia APROVADA! Merece capital real.');
      } else if (finalValidation.overallStatus === 'QUASE') {
        toast.warning('⚠️ Estratégia QUASE aprovada. Necessita ajustes.');
      } else {
        toast.error('❌ Estratégia REPROVADA. Não usar capital real.');
      }
      
    } catch (error) {
      console.error('[ASYMMETRIC] Erro no backtest:', error);
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Falha no backtest'}`);
      setProgress(0);
      setProgressMessage('Erro');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const reset = useCallback(() => {
    setBacktestResult(null);
    setMonteCarloResult(null);
    setCandles([]);
    setProgress(0);
    setProgressMessage('');
  }, []);

  return {
    isLoading,
    progress,
    progressMessage,
    backtestResult,
    monteCarloResult,
    candles,
    config,
    setConfig,
    runBacktest,
    reset
  };
}
