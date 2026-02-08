import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { analyzeAsset } from '@/services/positionAnalysis/analyzer';
import type { AnalysisResult, AssetData } from '@/services/positionAnalysis/types';

interface UsePositionAnalysisOptions {
  range?: string;
  interval?: string;
}

interface UsePositionAnalysisReturn {
  data: AnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  analyze: (ticker: string) => void;
  ticker: string;
}

async function fetchAssetData(
  ticker: string,
  range: string,
  interval: string
): Promise<AssetData> {
  // supabase.functions.invoke usa POST por padrão
  const { data, error } = await supabase.functions.invoke('fetch-asset-data', {
    body: { ticker, range, interval },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao buscar dados do ativo');
  }

  if (!data) {
    throw new Error('Nenhum dado retornado');
  }

  return data as AssetData;
}

export function usePositionAnalysis(
  options: UsePositionAnalysisOptions = {}
): UsePositionAnalysisReturn {
  const { range = '1y', interval = '1d' } = options;
  const [ticker, setTicker] = useState<string>('');

  const {
    data: analysisResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['position-analysis', ticker, range, interval],
    queryFn: async () => {
      if (!ticker) return null;
      const assetData = await fetchAssetData(ticker, range, interval);
      return analyzeAsset(assetData);
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
  });

  const analyze = useCallback((newTicker: string) => {
    const normalizedTicker = newTicker.trim().toUpperCase();
    if (normalizedTicker && normalizedTicker !== ticker) {
      setTicker(normalizedTicker);
    } else if (normalizedTicker === ticker) {
      refetch();
    }
  }, [ticker, refetch]);

  return {
    data: analysisResult || null,
    isLoading,
    error: error as Error | null,
    analyze,
    ticker,
  };
}
