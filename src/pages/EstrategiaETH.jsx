import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { fetchETHUSDTData } from '@/services/binanceService';
import { calculateDidiIndex, calculateDMI, calculateEMA, calculateATR } from '@/utils/technicalIndicators';
import StrategyMetrics from '@/components/strategy/StrategyMetrics';
import TechnicalGauges from '@/components/strategy/TechnicalGauges';
import CandlestickChart from '@/components/strategy/CandlestickChart';
import SignalTimeline from '@/components/strategy/SignalTimeline';

const EstrategiaETH = () => {
  const [lastSignal, setLastSignal] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);
  const [successfulSignals, setSuccessfulSignals] = useState([]);
  const [conditionsStatus, setConditionsStatus] = useState(null);

  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['ethusdt-15m'],
    queryFn: () => fetchETHUSDTData('15m'),
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  useEffect(() => {
    if (marketData) {
      analyzeStrategy(marketData);
      checkSuccessfulSignals(marketData);
    }
  }, [marketData]);

  const checkSuccessfulSignals = (data) => {
    if (!data || data.length === 0 || operationHistory.length === 0) return;

    const currentPrice = data[data.length - 1].close;
    
    operationHistory.forEach((signal) => {
      // Verifica se o sinal ainda não foi marcado como sucesso
      const alreadySuccessful = successfulSignals.some(s => s.timestamp === signal.timestamp);
      if (alreadySuccessful) return;

      // Verifica se atingiu o take profit
      let hitTarget = false;
      if (signal.type === 'COMPRA' && currentPrice >= signal.takeProfit) {
        hitTarget = true;
      } else if (signal.type === 'VENDA' && currentPrice <= signal.takeProfit) {
        hitTarget = true;
      }

      if (hitTarget) {
        const profitPercent = signal.type === 'COMPRA' 
          ? ((signal.takeProfit - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)
          : ((signal.entryPrice - signal.takeProfit) / signal.entryPrice * 100).toFixed(2);

        const successSignal = {
          ...signal,
          closedAt: new Date().toLocaleString('pt-BR'),
          profit: profitPercent,
          status: 'SUCESSO'
        };

        setSuccessfulSignals(prev => [successSignal, ...prev].slice(0, 20));
        toast.success(`Sinal de ${signal.type} atingiu o alvo! +${profitPercent}%`);
      }
    });
  };

  const analyzeStrategy = (data) => {
    if (!data || data.length < 100) return;

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const opens = data.map(d => d.open);
    const volumes = data.map(d => d.volume);

    // 1. Identificar o candle de referência (menor corpo real entre as últimas 5 velas)
    const last5Candles = data.slice(-6, -1); // Últimas 5 velas fechadas
    let smallestCandleIndex = 0;
    let smallestBody = Infinity;

    last5Candles.forEach((candle, idx) => {
      const body = Math.abs(candle.close - candle.open);
      if (body < smallestBody) {
        smallestBody = body;
        smallestCandleIndex = idx;
      }
    });

    const referenceCandle = last5Candles[smallestCandleIndex];
    const triggerCandle = data[data.length - 1]; // Candle atual (gatilho)

    // 2. Calcular indicadores
    const didiIndex = calculateDidiIndex(closes);
    const dmi = calculateDMI(highs, lows, closes);
    const atr = calculateATR(highs, lows, closes, 14);
    
    // EMA50 no timeframe de 1h (simulado com dados de 15m)
    const ema50 = calculateEMA(closes, 50);

    // 3. Verificar rompimento
    const breakoutThreshold = 0.0005; // 0.05%
    const buyBreakout = triggerCandle.close > referenceCandle.high * (1 + breakoutThreshold);
    const sellBreakout = triggerCandle.close < referenceCandle.low * (1 - breakoutThreshold);

    // 4. Validar Didi Index (agulhada)
    const didiConfirmBuy = didiIndex.short[didiIndex.short.length - 1] > didiIndex.medium[didiIndex.medium.length - 1] &&
                           didiIndex.short[didiIndex.short.length - 1] > didiIndex.long[didiIndex.long.length - 1];
    
    const didiConfirmSell = didiIndex.short[didiIndex.short.length - 1] < didiIndex.medium[didiIndex.medium.length - 1] &&
                            didiIndex.short[didiIndex.short.length - 1] < didiIndex.long[didiIndex.long.length - 1];

    // 5. Validar DMI
    const currentDMI = dmi[dmi.length - 1];
    const prevDMI = dmi[dmi.length - 2];
    const dmiConfirmBuy = currentDMI.plusDI > currentDMI.minusDI && 
                          currentDMI.adx > 25 && 
                          currentDMI.adx > prevDMI.adx;
    
    const dmiConfirmSell = currentDMI.minusDI > currentDMI.plusDI && 
                           currentDMI.adx > 25 && 
                           currentDMI.adx > prevDMI.adx;

    // 6. Validar EMA50 (contexto de tendência)
    const currentPrice = triggerCandle.close;
    const ema50Confirm = ema50[ema50.length - 1];
    const trendUp = currentPrice > ema50Confirm;
    const trendDown = currentPrice < ema50Confirm;

    // 7. Filtros adicionais
    const avgATR = atr.slice(-100).reduce((a, b) => a + b, 0) / 100;
    const volatilityOk = atr[atr.length - 1] >= avgATR * 0.5;
    
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volumeOk = triggerCandle.volume >= avgVolume;

    // 8. Salvar status das condições para debug
    setConditionsStatus({
      buy: {
        breakout: buyBreakout,
        didi: didiConfirmBuy,
        dmi: dmiConfirmBuy,
        trend: trendUp,
        volatility: volatilityOk,
        volume: volumeOk
      },
      sell: {
        breakout: sellBreakout,
        didi: didiConfirmSell,
        dmi: dmiConfirmSell,
        trend: trendDown,
        volatility: volatilityOk,
        volume: volumeOk
      },
      currentPrice,
      ema50Value: ema50Confirm,
      adx: currentDMI.adx,
      atrValue: atr[atr.length - 1],
      avgVolume,
      currentVolume: triggerCandle.volume,
      referenceHigh: referenceCandle.high,
      referenceLow: referenceCandle.low
    });

    // 9. Gerar sinal
    let signal = null;

    if (buyBreakout && didiConfirmBuy && dmiConfirmBuy && trendUp && volatilityOk && volumeOk) {
      const entryPrice = triggerCandle.close;
      const stopLoss = referenceCandle.low * (1 - breakoutThreshold);
      const risk = entryPrice - stopLoss;
      const takeProfit = entryPrice + (risk * 2);

      signal = {
        type: 'COMPRA',
        entryPrice,
        stopLoss,
        takeProfit,
        timestamp: new Date().toLocaleString('pt-BR'),
        confirmations: {
          didi: true,
          dmi: true,
          ema50: true,
          volatility: volatilityOk,
          volume: volumeOk
        },
        adx: currentDMI.adx.toFixed(2),
        atr: atr[atr.length - 1].toFixed(2)
      };
    } else if (sellBreakout && didiConfirmSell && dmiConfirmSell && trendDown && volatilityOk && volumeOk) {
      const entryPrice = triggerCandle.close;
      const stopLoss = referenceCandle.high * (1 + breakoutThreshold);
      const risk = stopLoss - entryPrice;
      const takeProfit = entryPrice - (risk * 2);

      signal = {
        type: 'VENDA',
        entryPrice,
        stopLoss,
        takeProfit,
        timestamp: new Date().toLocaleString('pt-BR'),
        confirmations: {
          didi: true,
          dmi: true,
          ema50: true,
          volatility: volatilityOk,
          volume: volumeOk
        },
        adx: currentDMI.adx.toFixed(2),
        atr: atr[atr.length - 1].toFixed(2)
      };
    }

    if (signal && (!lastSignal || lastSignal.timestamp !== signal.timestamp)) {
      setLastSignal(signal);
      setOperationHistory(prev => [signal, ...prev.slice(0, 9)]);
      toast.success(`Novo sinal de ${signal.type} detectado!`);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Dados atualizados');
  };

  if (isLoading) return <LoadingSpinner message="Carregando dados ETHUSDT..." />;
  if (error) return <ErrorDisplay message="Erro ao carregar dados de mercado" />;

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20">
      {/* Header com gradiente e animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Estratégia ETHUSDT</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Análise automática com Didi Index + DMI + Rompimento (Timeframe: 15min)
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="self-end sm:self-auto hover:bg-primary/10 hover:border-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Métricas de Performance */}
      <StrategyMetrics 
        signals={operationHistory} 
        successfulSignals={successfulSignals} 
      />

      {/* Indicadores Técnicos Visuais */}
      <TechnicalGauges conditionsStatus={conditionsStatus} />

      {/* Gráfico de Candlestick */}
      <CandlestickChart marketData={marketData} lastSignal={lastSignal} />

      {/* Sinal Atual */}
      {lastSignal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`border-2 ${lastSignal.type === 'COMPRA' ? 'border-green-500' : 'border-red-500'}`}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {lastSignal.type === 'COMPRA' ? (
                  <ArrowUpCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <ArrowDownCircle className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
                )}
                Sinal de {lastSignal.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Entrada</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold">${lastSignal.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Stop Loss</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-red-500">${lastSignal.stopLoss.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Take Profit</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-green-500">${lastSignal.takeProfit.toFixed(2)}</p>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Data/Hora</p>
                  <p className="text-xs sm:text-sm font-medium">{lastSignal.timestamp}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge variant={lastSignal.confirmations.didi ? "default" : "destructive"} className="text-xs">
                  Didi {lastSignal.confirmations.didi ? '✅' : '❌'}
                </Badge>
                <Badge variant={lastSignal.confirmations.dmi ? "default" : "destructive"} className="text-xs">
                  DMI {lastSignal.confirmations.dmi ? '✅' : '❌'}
                </Badge>
                <Badge variant={lastSignal.confirmations.ema50 ? "default" : "destructive"} className="text-xs">
                  EMA50 {lastSignal.confirmations.ema50 ? '✅' : '❌'}
                </Badge>
                <Badge variant="outline" className="text-xs">ADX: {lastSignal.adx}</Badge>
                <Badge variant="outline" className="text-xs">ATR: {lastSignal.atr}</Badge>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="leading-tight">Risco:Retorno = 1:2 | Máx. 2 operações/hora</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Timeline de Sinais */}
      <SignalTimeline 
        signals={operationHistory} 
        successfulSignals={successfulSignals} 
      />

      {/* Painel de Condições (colapsável) */}
      {conditionsStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                Status Detalhado das Condições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              {/* Condições de Compra */}
              <div>
                <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <ArrowUpCircle className="text-green-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Condições para COMPRA
                </h3>
                <div className="grid gap-1.5 sm:gap-2">
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Rompimento de Alta</span>
                    <Badge variant={conditionsStatus.buy.breakout ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.breakout ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Didi Index (Agulhada Alta)</span>
                    <Badge variant={conditionsStatus.buy.didi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.didi ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">DMI (+DI &gt; -DI, ADX &gt; 25)</span>
                    <Badge variant={conditionsStatus.buy.dmi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.dmi ? "✅ OK" : "❌ Não"} (ADX: {conditionsStatus.adx.toFixed(1)})
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Tendência (Preço &gt; EMA50)</span>
                    <Badge variant={conditionsStatus.buy.trend ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.trend ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volatilidade Adequada</span>
                    <Badge variant={conditionsStatus.buy.volatility ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.volatility ? "✅ OK" : "❌ Baixa"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volume Adequado</span>
                    <Badge variant={conditionsStatus.buy.volume ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.buy.volume ? "✅ OK" : "❌ Baixo"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Condições de Venda */}
              <div>
                <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <ArrowDownCircle className="text-red-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  Condições para VENDA
                </h3>
                <div className="grid gap-1.5 sm:gap-2">
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Rompimento de Baixa</span>
                    <Badge variant={conditionsStatus.sell.breakout ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.breakout ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Didi Index (Agulhada Baixa)</span>
                    <Badge variant={conditionsStatus.sell.didi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.didi ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">DMI (-DI &gt; +DI, ADX &gt; 25)</span>
                    <Badge variant={conditionsStatus.sell.dmi ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.dmi ? "✅ OK" : "❌ Não"} (ADX: {conditionsStatus.adx.toFixed(1)})
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Tendência (Preço &lt; EMA50)</span>
                    <Badge variant={conditionsStatus.sell.trend ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.trend ? "✅ OK" : "❌ Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volatilidade Adequada</span>
                    <Badge variant={conditionsStatus.sell.volatility ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.volatility ? "✅ OK" : "❌ Baixa"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded border text-xs sm:text-sm">
                    <span className="pr-2">Volume Adequado</span>
                    <Badge variant={conditionsStatus.sell.volume ? "default" : "outline"} className="text-xs flex-shrink-0">
                      {conditionsStatus.sell.volume ? "✅ OK" : "❌ Baixo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Descrição da Estratégia */}
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Sobre a Estratégia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm p-4 sm:p-6 pt-0">
          <p><strong>Timeframe:</strong> 15 minutos</p>
          <p><strong>Ativo:</strong> ETHUSDT</p>
          <p><strong>Indicadores:</strong> Didi Index, DMI (ADX), EMA50, ATR</p>
          <p><strong>Lógica:</strong> Identifica o menor candle entre as últimas 5 velas e aguarda rompimento confirmado por múltiplos indicadores técnicos.</p>
          <p><strong>Gestão de Risco:</strong> Stop Loss baseado na mínima/máxima do candle de referência. Take Profit com relação 1:2.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaETH;
