
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { fetchTopFormationData } from '../services/cryptoService';
import { toast } from "sonner";
import { RSI, BollingerBands } from 'technicalindicators';
import { Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import PriceAnalysisChart from '../components/market/PriceAnalysisChart';
import TechnicalIndicators from '../components/market/TechnicalIndicators';
import EntityAnalysis from '../components/market/EntityAnalysis';

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
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-8 w-8 text-primary" />
            </motion.div>
            <span className="ml-2 text-muted-foreground">Carregando análise...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data?.prices?.length) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-destructive text-lg">
                Não foi possível carregar os dados no momento.
              </p>
              <p className="text-muted-foreground">
                Por favor, verifique sua conexão e tente novamente em alguns instantes.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </CardContent>
        </Card>
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
  const lastUpdateTime = new Date(dataUpdatedAt).toLocaleTimeString();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Formação de Topo</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última atualização: {lastUpdateTime}</span>
          </div>
        </div>
      </motion.div>
      
      <PriceAnalysisChart data={data} formatCurrency={formatCurrency} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TechnicalIndicators analise={analise} />
        <EntityAnalysis data={data} />
      </div>
    </div>
  );
};

export default FormacaoTopo;
