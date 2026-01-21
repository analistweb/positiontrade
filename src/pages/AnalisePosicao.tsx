import React from 'react';
import { motion } from 'framer-motion';
import { Target, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePositionAnalysis } from '@/hooks/usePositionAnalysis';
import {
  AssetSearchInput,
  TrendCard,
  IndicatorsCard,
  LevelsTable,
  RiskScoreCard,
  EntryPointsCard,
  ExecutiveSummary,
  PositionChart,
} from '@/components/position';

export default function AnalisePosicao() {
  const { data, isLoading, error, analyze, ticker } = usePositionAnalysis();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Análise para Position Trade</h1>
          </div>
          <p className="text-muted-foreground">
            Analise ativos de múltiplos mercados (B3, US, Crypto) com indicadores técnicos, suportes/resistências e pontos de entrada.
          </p>
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <AssetSearchInput
            onSearch={analyze}
            isLoading={isLoading}
            currentTicker={ticker}
          />
        </motion.div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Analisando {ticker}...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div className="space-y-6">
            {/* Row 1: Trend + Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendCard
                trend={data.tendencia}
                currentPrice={data.currentPrice}
                currency={data.currency}
              />
              <IndicatorsCard
                indicators={data.indicadores}
                currency={data.currency}
              />
            </div>

            {/* Row 2: Chart */}
            <PositionChart
              candles={data.candles}
              sma50={data.sma50Series}
              sma200={data.sma200Series}
              levels={data.suportesResistencias}
              entries={data.positionTrade}
              currency={data.currency}
            />

            {/* Row 3: Levels + Risk + Entries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <LevelsTable
                levels={data.suportesResistencias}
                currentPrice={data.currentPrice}
                currency={data.currency}
              />
              <RiskScoreCard risk={data.risco} />
              <EntryPointsCard
                entries={data.positionTrade}
                currency={data.currency}
              />
            </div>

            {/* Row 4: Summary */}
            <ExecutiveSummary
              summary={data.resumo}
              ticker={data.ticker}
              analyzedAt={data.analyzedAt}
            />
          </div>
        )}

        {/* Empty State */}
        {!data && !isLoading && !error && (
          <div className="text-center py-20">
            <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Comece sua análise</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Digite um ticker acima para receber análise técnica completa com tendência, suportes/resistências e pontos de entrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
