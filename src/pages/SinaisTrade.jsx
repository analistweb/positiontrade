import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Radio, 
  Activity, 
  Bell, 
  Volume2, 
  VolumeX,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Target,
  Shield,
  TrendingUp,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import CryptoSignalCard from '@/components/trading/CryptoSignalCard';
import { SUPPORTED_PAIRS } from '@/services/tradingService';

const SinaisTrade = () => {
  const [selectedPairs, setSelectedPairs] = useState(['BTCUSDT', 'ETHUSDT']);
  const [allSignals, setAllSignals] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('signals');
  
  const audioRef = useRef({
    buy: typeof Audio !== 'undefined' ? new Audio('/sounds/buy.mp3') : null,
    sell: typeof Audio !== 'undefined' ? new Audio('/sounds/sell.mp3') : null
  });

  const handleNewSignal = (signal) => {
    setAllSignals(prev => [signal, ...prev].slice(0, 100));
    
    // Tocar som
    if (soundEnabled) {
      try {
        const soundType = signal.type === 'COMPRA' ? 'buy' : 'sell';
        audioRef.current[soundType]?.play().catch(console.log);
      } catch (e) {
        console.log('Audio não suportado');
      }
    }
    
    // Notificação
    toast[signal.type === 'COMPRA' ? 'success' : 'error'](
      `${signal.symbol}: Sinal de ${signal.type}!`,
      {
        description: `Entrada: $${signal.entryPrice.toFixed(2)} | TP: $${signal.takeProfit.toFixed(2)} | SL: $${signal.stopLoss.toFixed(2)}`
      }
    );
  };

  const togglePair = (symbol) => {
    setSelectedPairs(prev => {
      if (prev.includes(symbol)) {
        if (prev.length === 1) return prev; // Manter pelo menos 1
        return prev.filter(s => s !== symbol);
      }
      return [...prev, symbol];
    });
  };

  const availablePairs = Object.keys(SUPPORTED_PAIRS);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Radio className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sinais de Trade</h1>
                <p className="text-sm text-muted-foreground">
                  Estratégia M15 em tempo real
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Toggle Som */}
              <div className="flex items-center gap-2">
                <Switch 
                  id="sound" 
                  checked={soundEnabled} 
                  onCheckedChange={setSoundEnabled}
                />
                <Label htmlFor="sound" className="cursor-pointer">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                </Label>
              </div>
              
              {/* Status */}
              <Badge variant="outline" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-buy animate-pulse" />
                {selectedPairs.length} ativos monitorados
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Cards de Sinais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleção de Pares */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Ativos Monitorados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availablePairs.map(symbol => {
                    const pair = SUPPORTED_PAIRS[symbol];
                    const isSelected = selectedPairs.includes(symbol);
                    return (
                      <Button
                        key={symbol}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => togglePair(symbol)}
                        className="gap-2"
                        style={isSelected ? { backgroundColor: pair.color } : {}}
                      >
                        <span className="font-bold">{pair.icon}</span>
                        {pair.shortName}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {selectedPairs.map(symbol => (
                  <motion.div
                    key={symbol}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CryptoSignalCard 
                      symbol={symbol} 
                      onSignal={handleNewSignal}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Informações da Estratégia */}
            <Card className="bg-elevated/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Sobre a Estratégia
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Estratégia de rompimento M15 com múltiplas confirmações:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Identificação do candle de menor corpo (consolidação)</li>
                  <li>Rompimento com threshold de 0.05%</li>
                  <li>Confirmação Didi Index (agulhada)</li>
                  <li>DMI com ADX &gt; 27 e crescente</li>
                  <li>EMA50 como filtro de tendência</li>
                  <li>Volume acima da média</li>
                  <li>RSI em zona favorável</li>
                  <li>MACD confirmando momentum</li>
                  <li>Score de mercado mínimo: 70</li>
                  <li>TP/SL com Fibonacci Adaptativo</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Histórico de Sinais */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Histórico de Sinais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {allSignals.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aguardando sinais...</p>
                      <p className="text-xs mt-1">Os sinais aparecerão aqui quando detectados</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {allSignals.map((signal, idx) => {
                        const pair = SUPPORTED_PAIRS[signal.symbol];
                        return (
                          <motion.div
                            key={`${signal.symbol}-${signal.timestamp}-${idx}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span style={{ color: pair?.color }}>{pair?.icon}</span>
                                <span className="font-medium text-sm">{pair?.shortName || signal.symbol}</span>
                              </div>
                              <Badge 
                                variant={signal.type === 'COMPRA' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {signal.type === 'COMPRA' ? (
                                  <ArrowUpCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowDownCircle className="w-3 h-3 mr-1" />
                                )}
                                {signal.type}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Entrada</p>
                                <p className="font-medium">${signal.entryPrice.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-buy flex items-center gap-1">
                                  <Target className="w-3 h-3" /> TP
                                </p>
                                <p className="font-medium">${signal.takeProfit.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sell flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> SL
                                </p>
                                <p className="font-medium">${signal.stopLoss.toFixed(2)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{signal.timestamp}</span>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-primary" />
                                <span className="text-xs text-primary font-medium">
                                  Score: {signal.strength}
                                </span>
                              </div>
                            </div>
                            
                            {signal.status && (
                              <Badge 
                                variant={signal.status === 'SUCESSO' ? 'success' : 'destructive'}
                                className="mt-2 w-full justify-center text-xs"
                              >
                                {signal.status} {signal.profit && `(${signal.profit}%)`}
                              </Badge>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinaisTrade;
