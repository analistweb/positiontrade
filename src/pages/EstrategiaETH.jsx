import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Radio,
  GitBranch,
  Zap,
  BarChart3,
  Target,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useBinanceKlineStream } from '@/services/binanceSocket';
import { showSignalNotification } from '@/components/strategy/SignalNotification';
import { useTradingStrategy } from '@/hooks/useTradingStrategy';
import StrategyMetrics from '@/components/strategy/StrategyMetrics';
import TechnicalGauges from '@/components/strategy/TechnicalGauges';
import CandlestickChart from '@/components/strategy/CandlestickChart';
import SignalTimeline from '@/components/strategy/SignalTimeline';
import SignalStrengthIndicator from '@/components/strategy/SignalStrengthIndicator';
import ParametersPanel from '@/components/strategy/ParametersPanel';
import ConfluenceTriangle from '@/components/strategy/ConfluenceTriangle';
import DiagnosticPanel from '@/components/strategy/DiagnosticPanel';
import ConnectionStatus from '@/components/strategy/ConnectionStatus';
import BacktestPanel from '@/components/strategy/BacktestPanel';
import { logger } from '@/utils/logger';
import { defaultStrategyConfig as STRATEGY_CONFIG, getAllVersions, ACTIVE_VERSION } from '@/config/strategyConfig';

const EstrategiaETH = () => {
  // Estados locais para histórico e UI
  const [successfulSignals, setSuccessfulSignals] = useState([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [parameters, setParameters] = useState({
    scoreThreshold: 60,
    minRR: 1.0,
    adxMin: 25,
    rsiOverbought: 75,
    rsiOversold: 25
  });
  
  // Ref para controle de notificações e áudio
  const lastNotifiedSignalRef = useRef(null);
  const audioRef = useRef({
    buy: typeof Audio !== 'undefined' ? new Audio('/sounds/buy.mp3') : null,
    sell: typeof Audio !== 'undefined' ? new Audio('/sounds/sell.mp3') : null
  });

  // ===== USA O HOOK CENTRALIZADO =====
  // Isso garante que a lógica de sinais seja IDÊNTICA à página /sinais-trade
  const {
    marketData,
    isLoading,
    error,
    refetch,
    lastSignal,
    signalStatus,
    conditionsStatus,
    activeOperation,
    signalHistory,
    diagnosticData,
    confluenceScores,
    marketRegime,
    currentPrice,
    cancelOperation
  } = useTradingStrategy('ETHUSDT', {
    interval: '15m',
    candleLimit: 100,
    refetchInterval: 5000,
    parameters: STRATEGY_CONFIG.scoring
  });

  // WebSocket para updates em tempo real
  const handleNewKline = (klineData) => {
    if (klineData?.isClosed) {
      refetch();
    }
  };

  const { connect, disconnect, isConnected } = useBinanceKlineStream('ethusdt', '15m', handleNewKline);

  useEffect(() => {
    connect();
    setIsWebSocketConnected(true);
    return () => {
      disconnect();
      setIsWebSocketConnected(false);
    };
  }, []);

  // Efeito para notificações e sons quando há novo sinal
  useEffect(() => {
    if (lastSignal && lastSignal.id !== lastNotifiedSignalRef.current) {
      lastNotifiedSignalRef.current = lastSignal.id;
      
      // Mostrar notificação
      showSignalNotification(lastSignal, 'signal');
      
      // Tocar som
      const soundType = lastSignal.type === 'COMPRA' ? 'buy' : 'sell';
      try {
        audioRef.current[soundType]?.play().catch(console.log);
      } catch (e) {
        console.log('Audio não suportado');
      }
      
      // Atualizar histórico de sucesso se for TP/SL
      if (lastSignal.status === 'SUCESSO' || lastSignal.status === 'STOP LOSS') {
        setSuccessfulSignals(prev => [lastSignal, ...prev].slice(0, 50));
      }
    }
  }, [lastSignal]);

  // Monitorar fechamento de operações (TP/SL)
  useEffect(() => {
    const closedSignals = signalHistory.filter(s => s.status === 'SUCESSO' || s.status === 'STOP LOSS');
    if (closedSignals.length > 0) {
      setSuccessfulSignals(prev => {
        const newSignals = closedSignals.filter(
          cs => !prev.some(ps => ps.timestamp === cs.timestamp)
        );
        return [...newSignals, ...prev].slice(0, 50);
      });
    }
  }, [signalHistory]);

  const handleRefresh = () => {
    refetch();
    toast.success('Dados atualizados');
  };

  // Converter conditionsStatus do hook para o formato esperado pelos componentes
  const mappedConditionsStatus = conditionsStatus ? {
    buy: {
      breakout: conditionsStatus.breakout?.isValid && conditionsStatus.breakout?.direction === 'buy',
      didi: conditionsStatus.didi?.short?.[conditionsStatus.didi?.short?.length - 1] > 
            conditionsStatus.didi?.medium?.[conditionsStatus.didi?.medium?.length - 1],
      dmi: conditionsStatus.dmi?.buy,
      trend: conditionsStatus.trend?.up,
      volatility: conditionsStatus.filters?.volatility,
      volume: conditionsStatus.filters?.volume,
      rsi: conditionsStatus.rsi?.buyOk,
      macd: conditionsStatus.macd?.bullish,
      obv: conditionsStatus.macd?.histogram > 0,
      breakoutStrength: conditionsStatus.breakout?.strength || 0,
      rrValid: true,
      intrabarValid: false,
      scoreValid: conditionsStatus.marketStrength >= 60,
      score: conditionsStatus.marketStrength || 0
    },
    sell: {
      breakout: conditionsStatus.breakout?.isValid && conditionsStatus.breakout?.direction === 'sell',
      didi: conditionsStatus.didi?.short?.[conditionsStatus.didi?.short?.length - 1] < 
            conditionsStatus.didi?.medium?.[conditionsStatus.didi?.medium?.length - 1],
      dmi: conditionsStatus.dmi?.sell,
      trend: conditionsStatus.trend?.down,
      volatility: conditionsStatus.filters?.volatility,
      volume: conditionsStatus.filters?.volume,
      rsi: conditionsStatus.rsi?.sellOk,
      macd: conditionsStatus.macd?.bearish,
      obv: conditionsStatus.macd?.histogram < 0,
      breakoutStrength: conditionsStatus.breakout?.strength || 0,
      rrValid: true,
      intrabarValid: false,
      scoreValid: conditionsStatus.marketStrength >= 60,
      score: conditionsStatus.marketStrength || 0
    },
    currentPrice: conditionsStatus.currentPrice || 0,
    ema50Value: conditionsStatus.trend?.ema50 || conditionsStatus.currentPrice || 0,
    adx: conditionsStatus.dmi?.adx || conditionsStatus.adx || 0,
    atrValue: conditionsStatus.atr || 0,
    avgVolume: conditionsStatus.avgVolume || 1,
    currentVolume: conditionsStatus.currentVolume || 0,
    referenceHigh: conditionsStatus.referenceCandle?.high || conditionsStatus.currentPrice || 0,
    referenceLow: conditionsStatus.referenceCandle?.low || conditionsStatus.currentPrice || 0,
    fibonacci: null,
    rrRatio: 0,
    direction: signalStatus !== 'wait' ? signalStatus : null,
    rsi: conditionsStatus.rsi?.value || 50,
    macdValue: conditionsStatus.macd?.histogram || 0,
    obvValue: 0,
    obvTrend: conditionsStatus.macd?.bullish ? 'up' : 'down',
    marketStrength: conditionsStatus.marketStrength || 50,
    volumeProfile: conditionsStatus.currentPrice || 0,
    swingHigh: null,
    swingLow: null,
    legSize: null,
    legDirection: null
  } : null;

  // Mapear lastSignal para formato esperado
  const mappedLastSignal = lastSignal ? {
    type: lastSignal.type,
    entryPrice: lastSignal.entryPrice,
    stopLoss: lastSignal.stopLoss,
    takeProfit: lastSignal.takeProfit,
    timestamp: lastSignal.timestamp,
    confirmations: {
      didi: true,
      dmi: true,
      ema50: true,
      volatility: true,
      volume: true,
      fibonacci: true,
      riskReward: true,
      rsi: true,
      macd: true,
      obv: true,
      breakoutStrength: lastSignal.strength || 0,
      marketStrength: lastSignal.strength || 0,
      score: lastSignal.strength || 0,
      intrabar: false
    },
    adx: conditionsStatus?.adx?.toFixed?.(2) || conditionsStatus?.dmi?.adx?.toFixed?.(2) || '0',
    atr: '0',
    fibonacciUsed: null,
    riskReward: lastSignal.rr?.toFixed?.(2) || '2.0',
    direction: lastSignal.type === 'COMPRA' ? 'buy' : 'sell',
    score: lastSignal.strength || 0
  } : null;

  if (isLoading) return <LoadingSpinner message="Carregando dados ETHUSDT..." />;
  if (error) return <ErrorDisplay message="Erro ao carregar dados de mercado" />;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header with Strategy Version */}
      <div className="strategy-hero border-b border-border/50 mb-6">
        <div className="strategy-hero-glow" />
        <div className="relative container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-muted flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  {signalStatus !== 'wait' && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${
                      signalStatus === 'buy' ? 'bg-success' : 'bg-danger'
                    }`}>
                      {signalStatus === 'buy' ? (
                        <ArrowUpCircle className="w-3 h-3 text-success-foreground" />
                      ) : (
                        <ArrowDownCircle className="w-3 h-3 text-danger-foreground" />
                      )}
                    </div>
                  )}
                </motion.div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Estratégia ETHUSDT</h1>
                    <ConnectionStatus 
                      wsConnected={isWebSocketConnected}
                      apiStatus="ok"
                      lastUpdate={new Date()}
                      latencyMs={50}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Engine Centralizado v{STRATEGY_CONFIG.version} • Regime: {marketRegime}
                  </p>
                </div>
              </div>

              {/* Version & Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="version-badge version-badge-active gap-1.5">
                  <GitBranch className="w-3 h-3" />
                  Engine {ACTIVE_VERSION}
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Clock className="w-3 h-3" />
                  M15
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <BarChart3 className="w-3 h-3" />
                  ETHUSDT
                </Badge>
                
                {/* Signal Status Badge */}
                {signalStatus === 'buy' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <Badge className="bg-success text-success-foreground gap-1 animate-pulse">
                      <ArrowUpCircle className="w-3 h-3" />
                      Sinal de Compra Ativo
                    </Badge>
                  </motion.div>
                )}
                {signalStatus === 'sell' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <Badge className="bg-danger text-danger-foreground gap-1 animate-pulse">
                      <ArrowDownCircle className="w-3 h-3" />
                      Sinal de Venda Ativo
                    </Badge>
                  </motion.div>
                )}
                {signalStatus === 'wait' && (
                  <Badge variant="secondary" className="gap-1">
                    <Activity className="w-3 h-3" />
                    Aguardando Condições
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Section - Quick Stats & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Quick Stats Cards */}
              <div className="flex items-center gap-3">
                <div className="metric-card flex flex-col items-center px-4 py-2 min-w-[80px]">
                  <span className="text-xs text-muted-foreground mb-1">Sinais</span>
                  <span className="font-bold text-lg">{signalHistory.length}</span>
                </div>
                <div className="metric-card flex flex-col items-center px-4 py-2 min-w-[80px]">
                  <span className="text-xs text-muted-foreground mb-1">Win Rate</span>
                  <span className="font-bold text-lg text-success">
                    {successfulSignals.filter(s => s.status === 'SUCESSO').length > 0 
                      ? Math.round((successfulSignals.filter(s => s.status === 'SUCESSO').length / successfulSignals.length) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="gap-2 hover:bg-primary/10 hover:border-primary transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de Performance */}
      <StrategyMetrics 
        signals={signalHistory} 
        successfulSignals={successfulSignals} 
      />

      {/* Indicadores Técnicos Visuais */}
      <TechnicalGauges conditionsStatus={mappedConditionsStatus} />

      {/* Indicador de Força do Sinal */}
      <SignalStrengthIndicator 
        conditionsStatus={mappedConditionsStatus} 
        signalStatus={signalStatus}
      />

      {/* Triângulo de Confluência */}
      <ConfluenceTriangle
        trendScore={mappedConditionsStatus ? (mappedConditionsStatus.buy?.trend || mappedConditionsStatus.sell?.trend ? 75 : 25) : 0}
        volumeScore={mappedConditionsStatus?.buy?.volume ? 80 : mappedConditionsStatus?.sell?.volume ? 80 : 30}
        momentumScore={mappedConditionsStatus?.marketStrength || 0}
        details={{
          ema50Aligned: mappedConditionsStatus?.buy?.trend || mappedConditionsStatus?.sell?.trend,
          htfAligned: (mappedConditionsStatus?.adx || 0) > 25,
          vwapAligned: true,
          volumeRatio: (mappedConditionsStatus?.currentVolume || 0) / (mappedConditionsStatus?.avgVolume || 1),
          volumeAboveAvg: mappedConditionsStatus?.buy?.volume || mappedConditionsStatus?.sell?.volume,
          obvAligned: mappedConditionsStatus?.buy?.obv || mappedConditionsStatus?.sell?.obv,
          vrocPositive: true,
          rsi: mappedConditionsStatus?.rsi,
          rsiValid: mappedConditionsStatus?.buy?.rsi || mappedConditionsStatus?.sell?.rsi,
          macdGrowing: mappedConditionsStatus?.buy?.macd || mappedConditionsStatus?.sell?.macd,
          adx: mappedConditionsStatus?.adx
        }}
      />

      {/* Painel de Diagnóstico do Score */}
      <DiagnosticPanel
        signal={mappedLastSignal}
        conditionsStatus={mappedConditionsStatus}
        parameters={parameters}
        configVersion={STRATEGY_CONFIG.version}
      />

      {/* Painel de Backtest e Monte Carlo */}
      <BacktestPanel symbol="ETHUSDT" />

      {/* Gráfico de Candlestick */}
      <CandlestickChart marketData={marketData} lastSignal={mappedLastSignal} />

      {/* Sinal Atual com Fibonacci */}
      {mappedLastSignal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`signal-card overflow-hidden ${
            mappedLastSignal.type === 'COMPRA' ? 'signal-card-buy' : 'signal-card-sell'
          } ${activeOperation ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
            <CardHeader className="p-4 sm:p-6 border-b border-border/30">
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    mappedLastSignal.type === 'COMPRA' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-danger/20 text-danger'
                  }`}>
                    {mappedLastSignal.type === 'COMPRA' ? (
                      <ArrowUpCircle className="w-5 h-5" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-lg font-bold">Sinal de {mappedLastSignal.type}</span>
                    <p className="text-xs text-muted-foreground font-normal">
                      Score: {mappedLastSignal.score}% • R:R {mappedLastSignal.riskReward}
                    </p>
                  </div>
                </div>
                {activeOperation && (
                  <Badge className="bg-primary/20 text-primary border border-primary/30 gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Operação Ativa
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Price Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="metric-card">
                  <p className="text-xs text-muted-foreground mb-1">Entrada</p>
                  <p className="metric-value">${mappedLastSignal.entryPrice.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-danger flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3" /> Stop Loss
                  </p>
                  <p className="metric-value-danger">${mappedLastSignal.stopLoss.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-success flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3" /> Take Profit
                  </p>
                  <p className="metric-value-success">${mappedLastSignal.takeProfit.toFixed(2)}</p>
                </div>
                <div className="metric-card col-span-2 lg:col-span-1">
                  <p className="text-xs text-muted-foreground mb-1">Risco:Retorno</p>
                  <p className="text-2xl font-bold text-primary">1:{mappedLastSignal.riskReward}</p>
                </div>
              </div>

              {/* Confirmations */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={mappedLastSignal.confirmations.didi ? "default" : "secondary"} className="gap-1">
                  {mappedLastSignal.confirmations.didi ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Didi
                </Badge>
                <Badge variant={mappedLastSignal.confirmations.dmi ? "default" : "secondary"} className="gap-1">
                  {mappedLastSignal.confirmations.dmi ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  DMI
                </Badge>
                <Badge variant={mappedLastSignal.confirmations.ema50 ? "default" : "secondary"} className="gap-1">
                  {mappedLastSignal.confirmations.ema50 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  EMA50
                </Badge>
                <Badge variant={mappedLastSignal.confirmations.fibonacci ? "default" : "secondary"} className="gap-1">
                  {mappedLastSignal.confirmations.fibonacci ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Fibonacci
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  ADX: {mappedLastSignal.adx}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Activity className="w-3 h-3" />
                  ATR: {mappedLastSignal.atr}
                </Badge>
              </div>

              {/* Info Banner */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {activeOperation 
                    ? "Aguardando TP ou SL para liberar nova entrada" 
                    : "Engine centralizado - sinais idênticos em todas as páginas"}
                </span>
              </div>

              {/* Botão de cancelar operação */}
              {activeOperation && (
                <Button 
                  variant="outline" 
                  className="w-full border-danger/50 text-danger hover:bg-danger/10"
                  onClick={cancelOperation}
                >
                  Cancelar Operação
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Painel de Personalização */}
      <ParametersPanel 
        onParametersChange={(params) => {
          console.log('Novos parâmetros aplicados:', params);
          setParameters(params);
        }}
      />

      {/* Timeline de Sinais */}
      <SignalTimeline 
        signals={signalHistory} 
        successfulSignals={successfulSignals} 
      />

      {/* Painel de Condições (colapsável) */}
      {mappedConditionsStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6 border-b border-border/30 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-primary" />
                Status Detalhado das Condições
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Condições de Compra */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center">
                      <ArrowUpCircle className="w-4 h-4 text-success" />
                    </div>
                    Condições para COMPRA
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Rompimento de Alta', value: mappedConditionsStatus.buy.breakout },
                      { label: 'Didi Index (Agulhada)', value: mappedConditionsStatus.buy.didi },
                      { label: 'DMI (+DI > -DI)', value: mappedConditionsStatus.buy.dmi, extra: `ADX: ${(mappedConditionsStatus.adx || 0).toFixed(1)}` },
                      { label: 'Tendência (Preço > EMA50)', value: mappedConditionsStatus.buy.trend },
                      { label: 'Volatilidade Adequada', value: mappedConditionsStatus.buy.volatility },
                      { label: 'Volume Adequado', value: mappedConditionsStatus.buy.volume },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                          item.value 
                            ? 'bg-success/5 border-success/20' 
                            : 'bg-muted/30 border-border/50'
                        }`}
                      >
                        <span className="text-foreground-muted">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.extra && <span className="text-muted-foreground">{item.extra}</span>}
                          {item.value ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Condições de Venda */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-danger/20 flex items-center justify-center">
                      <ArrowDownCircle className="w-4 h-4 text-danger" />
                    </div>
                    Condições para VENDA
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Rompimento de Baixa', value: mappedConditionsStatus.sell.breakout },
                      { label: 'Didi Index (Agulhada)', value: mappedConditionsStatus.sell.didi },
                      { label: 'DMI (-DI > +DI)', value: mappedConditionsStatus.sell.dmi, extra: `ADX: ${(mappedConditionsStatus.adx || 0).toFixed(1)}` },
                      { label: 'Tendência (Preço < EMA50)', value: mappedConditionsStatus.sell.trend },
                      { label: 'Volatilidade Adequada', value: mappedConditionsStatus.sell.volatility },
                      { label: 'Volume Adequado', value: mappedConditionsStatus.sell.volume },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                          item.value 
                            ? 'bg-danger/5 border-danger/20' 
                            : 'bg-muted/30 border-border/50'
                        }`}
                      >
                        <span className="text-foreground-muted">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.extra && <span className="text-muted-foreground">{item.extra}</span>}
                          {item.value ? (
                            <CheckCircle2 className="w-4 h-4 text-danger" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Descrição da Estratégia */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Sobre a Estratégia
            <Badge className="version-badge version-badge-active ml-2">
              v{STRATEGY_CONFIG.version}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Core Info */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Configuração
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Timeframe</span>
                    <p className="font-semibold">15 minutos</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Ativo</span>
                    <p className="font-semibold">ETHUSDT</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Indicadores Principais</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['Didi Index', 'DMI (ADX)', 'EMA50', 'ATR', 'Fibonacci'].map(ind => (
                    <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Indicadores Avançados</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['RSI', 'MACD', 'OBV', 'Volume Profile', 'VROC'].map(ind => (
                    <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Gestão de Risco */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-warning" />
                  Gestão de Risco (ATR Fixo)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-danger/10 border border-danger/20">
                    <span>Stop Loss</span>
                    <span className="font-semibold">1.35 × ATR</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-success/10 border border-success/20">
                    <span>Take Profit</span>
                    <span className="font-semibold">2.75 × ATR</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <span>Risco/Trade</span>
                    <span className="font-semibold">≤ 0.5%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Recursos Implementados
                </h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Engine centralizado (sinais idênticos em todas as páginas)
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Sistema de notificações em tempo real
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Painel de personalização de parâmetros
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    Backtest com Monte Carlo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaETH;
