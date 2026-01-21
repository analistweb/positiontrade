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
  const { data, error } = await supabase.functions.invoke('fetch-asset-data', {
    body: null,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Use query params via URL
  const response = await fetch(
    `https://gunkkcdtsibxhspkjweu.supabase.co/functions/v1/fetch-asset-data?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1bmtrY2R0c2lieGhzcGtqd2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzczNjYsImV4cCI6MjA3OTIxMzM2Nn0.RH2aHJWwPF9a6mxSMl5j3q-VOha2KMp5_Ceg-i53B0c',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ao buscar dados: ${response.statusText}`);
  }

  return response.json();
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
