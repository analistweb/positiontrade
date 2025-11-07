import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { fetchETHUSDTData } from '@/services/binanceService';
import { calculateDidiIndex, calculateDMI, calculateEMA, calculateATR } from '@/utils/technicalIndicators';

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

      {/* Painel de Debug das Condições */}
      {conditionsStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Status das Condições em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Condições de Compra */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowUpCircle className="text-green-500 w-5 h-5" />
                Condições para COMPRA
              </h3>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Rompimento de Alta</span>
                  <Badge variant={conditionsStatus.buy.breakout ? "default" : "outline"}>
                    {conditionsStatus.buy.breakout ? "✅ OK" : "❌ Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Didi Index (Agulhada Alta)</span>
                  <Badge variant={conditionsStatus.buy.didi ? "default" : "outline"}>
                    {conditionsStatus.buy.didi ? "✅ OK" : "❌ Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">DMI (+DI &gt; -DI, ADX &gt; 25)</span>
                  <Badge variant={conditionsStatus.buy.dmi ? "default" : "outline"}>
                    {conditionsStatus.buy.dmi ? "✅ OK" : "❌ Não"} (ADX: {conditionsStatus.adx.toFixed(1)})
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Tendência (Preço &gt; EMA50)</span>
                  <Badge variant={conditionsStatus.buy.trend ? "default" : "outline"}>
                    {conditionsStatus.buy.trend ? "✅ OK" : "❌ Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Volatilidade Adequada</span>
                  <Badge variant={conditionsStatus.buy.volatility ? "default" : "outline"}>
                    {conditionsStatus.buy.volatility ? "✅ OK" : "❌ Baixa"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Volume Adequado</span>
                  <Badge variant={conditionsStatus.buy.volume ? "default" : "outline"}>
                    {conditionsStatus.buy.volume ? "✅ OK" : "❌ Baixo"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Condições de Venda */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowDownCircle className="text-red-500 w-5 h-5" />
                Condições para VENDA
              </h3>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Rompimento de Baixa</span>
                  <Badge variant={conditionsStatus.sell.breakout ? "default" : "outline"}>
                    {conditionsStatus.sell.breakout ? "✅ OK" : "❌ Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Didi Index (Agulhada Baixa)</span>
                  <Badge variant={conditionsStatus.sell.didi ? "default" : "outline"}>
                    {conditionsStatus.sell.didi ? "✅ OK" : "❌ Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">DMI (-DI &gt; +DI, ADX &gt; 25)</span>
                  <Badge variant={conditionsStatus.sell.dmi ? "default" : "outline"}>
                    {conditionsStatus.sell.dmi ? "✅ OK" : "❌ Não"} (ADX: {conditionsStatus.adx.toFixed(1)})
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Tendência (Preço &lt; EMA50)</span>
                  <Badge variant={conditionsStatus.sell.trend ? "default" : "outline"}>
                    {conditionsStatus.sell.trend ? "✅ OK" : "❌ Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Volatilidade Adequada</span>
                  <Badge variant={conditionsStatus.sell.volatility ? "default" : "outline"}>
                    {conditionsStatus.sell.volatility ? "✅ OK" : "❌ Baixa"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Volume Adequado</span>
                  <Badge variant={conditionsStatus.sell.volume ? "default" : "outline"}>
                    {conditionsStatus.sell.volume ? "✅ OK" : "❌ Baixo"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Valores Atuais */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Preço Atual</p>
                <p className="text-lg font-bold">${conditionsStatus.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">EMA50</p>
                <p className="text-lg font-bold">${conditionsStatus.ema50Value.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ATR</p>
                <p className="text-lg font-bold">{conditionsStatus.atrValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume Atual</p>
                <p className="text-sm font-medium">{conditionsStatus.currentVolume.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume Médio</p>
                <p className="text-sm font-medium">{conditionsStatus.avgVolume.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ref. Alta/Baixa</p>
                <p className="text-sm font-medium">${conditionsStatus.referenceHigh.toFixed(2)} / ${conditionsStatus.referenceLow.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sinais Bem-Sucedidos */}
      <Card className="border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-green-500 w-5 h-5" />
            Sinais de Sucesso (Take Profit Atingido)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {successfulSignals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum sinal atingiu o alvo ainda</p>
          ) : (
            <div className="space-y-3">
              {successfulSignals.map((op, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg border border-green-500/30 bg-green-500/10"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="text-green-500 w-5 h-5" />
                        <span className="font-semibold">{op.type}</span>
                        <Badge variant="default" className="bg-green-500">+{op.profit}%</Badge>
                      </div>
                      <Badge variant="outline" className="text-green-500 border-green-500">✓ SUCESSO</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entrada: </span>
                        <span className="font-medium">${op.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Alvo: </span>
                        <span className="font-medium text-green-500">${op.takeProfit.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Aberto: {op.timestamp}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Fechado: {op.closedAt}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Operações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Todos os Sinais</CardTitle>
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
