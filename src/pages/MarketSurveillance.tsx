import React from 'react';
import { MarketSurveillanceProvider } from '@/contexts/MarketSurveillanceContext';
import {
  MarketStatusCard,
  MarketControlBar,
  WhatIsHappeningCard,
  ImmediateRiskCard,
  CorrelationSimpleCard,
} from '@/components/surveillance';

const MarketSurveillance: React.FC = () => {
  return (
    <MarketSurveillanceProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              🔍 Vigilância de Mercado
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de detecção de manipulação em tempo real
            </p>
          </div>

          {/* Control Bar */}
          <MarketControlBar />

          {/* Main Grid - Mobile-first: stack, Desktop: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Status Card - Full width on mobile, spans first column on desktop */}
            <div className="md:row-span-1">
              <MarketStatusCard />
            </div>

            {/* What Is Happening Card */}
            <div className="md:row-span-1">
              <WhatIsHappeningCard />
            </div>

            {/* Immediate Risk Card */}
            <div>
              <ImmediateRiskCard />
            </div>

            {/* Correlation Card */}
            <div>
              <CorrelationSimpleCard />
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Aviso:</strong> Este sistema é uma ferramenta de análise e não
              constitui aconselhamento financeiro. Manipulação de mercado pode
              ocorrer de formas não detectáveis por algoritmos. Sempre faça sua
              própria pesquisa antes de operar.
            </p>
          </div>
        </div>
      </div>
    </MarketSurveillanceProvider>
  );
};

export default MarketSurveillance;
