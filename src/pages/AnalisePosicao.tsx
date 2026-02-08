import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePositionAnalysis } from '@/hooks/usePositionAnalysis';
import {
  AssetSearchInput,
  MarketStatusWidget,
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
  
  const hasResults = !!data || isLoading || !!error;

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {!hasResults ? (
          // ===== CENTERED GOOGLE-LIKE LAYOUT =====
          <motion.div
            key="search-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4"
          >
            {/* Market Status */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <MarketStatusWidget compact />
            </motion.div>

            {/* Logo / Title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <TrendingUp className="h-10 w-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Position Trade
                </h1>
              </div>
              <p className="text-xl text-muted-foreground font-light">
                Analyzer
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-2xl"
            >
              <AssetSearchInput
                onSearch={analyze}
                isLoading={isLoading}
                currentTicker={ticker}
                variant="centered"
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 text-sm text-muted-foreground/60 text-center max-w-md"
            >
              Analise ativos de B3, US Markets e Crypto com indicadores técnicos, suportes/resistências e pontos de entrada.
            </motion.p>
          </motion.div>
        ) : (
          // ===== RESULTS LAYOUT =====
          <motion.div
            key="results-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto px-4 py-6 max-w-7xl"
          >
            {/* Top Bar: Search + Markets */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              <div className="flex-1 w-full sm:max-w-xl">
                <AssetSearchInput
                  onSearch={analyze}
                  isLoading={isLoading}
                  currentTicker={ticker}
                  variant="compact"
                />
              </div>
              <MarketStatusWidget compact className="hidden sm:flex" />
            </div>

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
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
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
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
