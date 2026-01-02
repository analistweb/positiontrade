/**
 * Hook para gerenciar backtest e simulação Monte Carlo
 */

import { useState, useCallback } from 'react';
import { runBacktest, fetchExtendedHistoricalData } from '@/services/backtest/backtestEngine';
import { runMonteCarloSimulation, bootstrapWinRate } from '@/services/backtest/monteCarloSimulation';
import { toast } from 'sonner';

export const useBacktest = (symbol = 'ETHUSDT') => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backtestResult, setBacktestResult] = useState(null);
  const [monteCarloResult, setMonteCarloResult] = useState(null);
  const [error, setError] = useState(null);

  const runFullAnalysis = useCallback(async (options = {}) => {
    const {
      days = 30,
      interval = '15m',
      initialCapital = 10000,
      riskPerTrade = 0.02,
      numSimulations = 1000
    } = options;

    setIsRunning(true);
    setProgress(0);
    setError(null);

    try {
      // Fase 1: Buscar dados históricos
      toast.info('Buscando dados históricos...', { id: 'backtest-progress' });
      setProgress(10);
      
      const historicalData = await fetchExtendedHistoricalData(symbol, interval, days);
      
      if (!historicalData || historicalData.length < 200) {
        throw new Error(`Dados insuficientes: ${historicalData?.length || 0} candles (mínimo: 200)`);
      }
      
      setProgress(30);
      toast.info(`${historicalData.length} candles carregados. Executando backtest...`, { id: 'backtest-progress' });

      // Fase 2: Executar backtest
      const backtest = runBacktest(historicalData, symbol, {
        initialCapital,
        riskPerTrade,
        commission: 0.001,
        slippage: 0.0005
      });

      if (!backtest.success) {
        throw new Error(backtest.error);
      }

      setBacktestResult(backtest);
      setProgress(60);

      // Fase 3: Executar Monte Carlo
      if (backtest.trades.length >= 5) {
        toast.info('Executando simulação Monte Carlo...', { id: 'backtest-progress' });
        
        const monteCarlo = runMonteCarloSimulation(backtest.trades, {
          numSimulations,
          initialCapital
        });

        if (monteCarlo.success) {
          // Adicionar bootstrap de win rate
          const winRateBootstrap = bootstrapWinRate(backtest.trades, 500);
          monteCarlo.winRateBootstrap = winRateBootstrap;
          
          setMonteCarloResult(monteCarlo);
        }
        
        setProgress(100);
        toast.success(`Análise completa: ${backtest.trades.length} trades simulados`, { id: 'backtest-progress' });
      } else {
        setProgress(100);
        toast.warning(`Poucos trades (${backtest.trades.length}) para simulação Monte Carlo`, { id: 'backtest-progress' });
      }

      return { backtest, monteCarlo: monteCarloResult };

    } catch (err) {
      console.error('Erro no backtest:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`, { id: 'backtest-progress' });
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [symbol]);

  const reset = useCallback(() => {
    setBacktestResult(null);
    setMonteCarloResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    isRunning,
    progress,
    backtestResult,
    monteCarloResult,
    error,
    runFullAnalysis,
    reset
  };
};

export default useBacktest;
