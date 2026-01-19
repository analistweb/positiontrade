import { useState, useCallback } from 'react';
import { fetchM15Candles, fetchH4Candles, validateDataSufficiency } from '@/services/harmonic/dataFetcher';
import { backtestEngine, type BacktestStats } from '@/services/harmonic/backtestEngine';
import { monteCarloSimulation, finalValidator } from '@/services/harmonic/monteCarloSimulation';
import type { BacktestResult, MonteCarloResult, ValidationResult, BacktestConfig } from '@/services/harmonic/types';

interface HarmonicBacktestState {
  isLoading: boolean;
  progress: string;
  backtest: BacktestResult | null;
  monteCarlo: MonteCarloResult | null;
  validation: ValidationResult | null;
  error: string | null;
  dataInfo: string | null;
  stats: BacktestStats | null;
}

const DEFAULT_CONFIG: BacktestConfig = {
  initialCapital: 10000,
  riskPerTrade: 0.01,
  slippage: 0.0005,
  exchangeFee: 0.0004,
  swingConfirmation: 2 // Reduzido de 3 para 2
};

export function useHarmonicBacktest() {
  const [state, setState] = useState<HarmonicBacktestState>({
    isLoading: false,
    progress: '',
    backtest: null,
    monteCarlo: null,
    validation: null,
    error: null,
    dataInfo: null,
    stats: null
  });

  const runBacktest = useCallback(async (config: Partial<BacktestConfig> = {}) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, progress: 'Buscando dados M15...', stats: null }));

    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      
      const candlesM15 = await fetchM15Candles('ETHUSDT', undefined, undefined, (n) => {
        setState(prev => ({ ...prev, progress: `M15: ${n} candles carregados...` }));
      });

      setState(prev => ({ ...prev, progress: 'Buscando dados H4...' }));
      const candlesH4 = await fetchH4Candles('ETHUSDT', undefined, undefined, (n) => {
        setState(prev => ({ ...prev, progress: `H4: ${n} candles carregados...` }));
      });

      const dataValidation = validateDataSufficiency(candlesM15, candlesH4);
      setState(prev => ({ ...prev, dataInfo: dataValidation.message }));

      if (!dataValidation.valid) {
        setState(prev => ({ ...prev, isLoading: false, error: dataValidation.message }));
        return;
      }

      setState(prev => ({ ...prev, progress: 'Executando backtest...' }));
      const backtestResult = backtestEngine(candlesM15, candlesH4, finalConfig);

      // Extrai stats do resultado
      const { stats, ...backtestWithoutStats } = backtestResult;

      setState(prev => ({ ...prev, progress: 'Rodando Monte Carlo (1000 simulações)...' }));
      const monteCarloResult = monteCarloSimulation(backtestWithoutStats.trades, finalConfig.initialCapital, 1000);

      setState(prev => ({ ...prev, progress: 'Validando estratégia...' }));
      const validationResult = finalValidator(backtestWithoutStats, monteCarloResult, finalConfig.initialCapital);

      setState({
        isLoading: false,
        progress: '',
        backtest: backtestWithoutStats,
        monteCarlo: monteCarloResult,
        validation: validationResult,
        error: null,
        dataInfo: dataValidation.message,
        stats
      });
    } catch (error) {
      console.error('[HARMONIC] Erro no backtest:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, []);

  return { ...state, runBacktest };
}
