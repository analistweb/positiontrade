import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { fetchETHUSDTData } from '@/services/binanceService';
import { calculateDidiIndex, calculateDMI, calculateEMA, calculateATR } from '@/utils/technicalIndicators';

const EstrategiaETH = () => {
  const [lastSignal, setLastSignal] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);

  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['ethusdt-15m'],
    queryFn: () => fetchETHUSDTData('15m'),
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  useEffect(() => {
    if (marketData) {
      analyzeStrategy(marketData);
    }
  }, [marketData]);

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

    // 8. Gerar sinal
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
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">Estratégia ETHUSDT</h1>
          <p className="text-muted-foreground">Didi Index + DMI + Rompimento (15min)</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Sinal Atual */}
      {lastSignal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`border-2 ${lastSignal.type === 'COMPRA' ? 'border-green-500' : 'border-red-500'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastSignal.type === 'COMPRA' ? (
                  <ArrowUpCircle className="text-green-500 w-6 h-6" />
                ) : (
                  <ArrowDownCircle className="text-red-500 w-6 h-6" />
                )}
                Sinal de {lastSignal.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entrada</p>
                  <p className="text-xl font-bold">${lastSignal.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stop Loss</p>
                  <p className="text-xl font-bold text-red-500">${lastSignal.stopLoss.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Take Profit</p>
                  <p className="text-xl font-bold text-green-500">${lastSignal.takeProfit.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="text-sm font-medium">{lastSignal.timestamp}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={lastSignal.confirmations.didi ? "default" : "destructive"}>
                  Didi {lastSignal.confirmations.didi ? '✅' : '❌'}
                </Badge>
                <Badge variant={lastSignal.confirmations.dmi ? "default" : "destructive"}>
                  DMI {lastSignal.confirmations.dmi ? '✅' : '❌'}
                </Badge>
                <Badge variant={lastSignal.confirmations.ema50 ? "default" : "destructive"}>
                  EMA50 {lastSignal.confirmations.ema50 ? '✅' : '❌'}
                </Badge>
                <Badge variant="outline">ADX: {lastSignal.adx}</Badge>
                <Badge variant="outline">ATR: {lastSignal.atr}</Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
                <span>Risco:Retorno = 1:2 | Máx. 2 operações/hora</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Histórico de Operações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Sinais</CardTitle>
        </CardHeader>
        <CardContent>
          {operationHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum sinal gerado ainda</p>
          ) : (
            <div className="space-y-3">
              {operationHistory.map((op, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    op.type === 'COMPRA' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {op.type === 'COMPRA' ? (
                        <TrendingUp className="text-green-500 w-5 h-5" />
                      ) : (
                        <TrendingDown className="text-red-500 w-5 h-5" />
                      )}
                      <span className="font-semibold">{op.type}</span>
                      <span className="text-sm text-muted-foreground">${op.entryPrice.toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{op.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Descrição da Estratégia */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre a Estratégia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
