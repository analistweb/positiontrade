
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { fetchTopFormationData } from '../services/cryptoService';
import { toast } from "sonner";
import { RSI, BollingerBands } from 'technicalindicators';
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import PriceAnalysisChart from '../components/market/PriceAnalysisChart';
import TechnicalIndicators from '../components/market/TechnicalIndicators';
import EntityAnalysis from '../components/market/EntityAnalysis';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { DataSourceBadge } from '../components/common/DataSourceBadge';

const analisarPadroesTopo = (precos) => {
  if (!precos || precos.length < 14) {
    return {
      rsi: null,
      bandaSuperior: null,
      bandaInferior: null
    };
  }

  const rsiInput = {
    values: precos,
    period: 14
  };
  const rsiValues = RSI.calculate(rsiInput);
  const rsiAtual = rsiValues[rsiValues.length - 1];

  const bbInput = {
    period: 20,
    values: precos,
    stdDev: 2
  };
  const bb = BollingerBands.calculate(bbInput);
  const ultimaBB = bb[bb.length - 1];

  return {
    rsi: rsiAtual,
    bandaSuperior: ultimaBB?.upper,
    bandaInferior: ultimaBB?.lower
  };
};

const FormacaoTopo = () => {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['topFormation'],
    queryFn: fetchTopFormationData,
    refetchInterval: 60000,
    retry: 3,
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
      console.error('Erro detalhado:', error);
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <LoadingSpinner message="Carregando análise de formação de topo..." />
      </div>
    );
  }

  if (error || !data?.prices?.length) {
    return (
      <div className="container mx-auto p-4">
        <ErrorDisplay
          title="Erro ao carregar dados de formação de topo"
          message="Não foi possível carregar os dados no momento. Por favor, verifique sua conexão e tente novamente em alguns instantes."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const precos = data.prices.map(([_, price]) => price);
  const analise = analisarPadroesTopo(precos);
  const precoAtual = precos[precos.length - 1];
  const lastUpdateTime = new Date(dataUpdatedAt).toLocaleTimeString();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Formação de Topo</h1>
            <DataSourceBadge isRealData={true} size="md" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última atualização: {lastUpdateTime}</span>
          </div>
        </div>
      </motion.div>
      
      <PriceAnalysisChart data={data} formatCurrency={formatCurrency} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TechnicalIndicators analise={analise} precoAtual={precoAtual} />
        <EntityAnalysis data={data} />
      </div>
    </div>
  );
};

export default FormacaoTopo;
