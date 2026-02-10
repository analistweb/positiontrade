import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Activity, Bell, Volume2, VolumeX, ArrowUpCircle, ArrowDownCircle, Clock, Target, Shield, TrendingUp, Settings2, Zap, BarChart3, Layers, CheckCircle2, XCircle, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import CryptoSignalCard from '@/components/trading/CryptoSignalCard';
import ConnectionStatus from '@/components/strategy/ConnectionStatus';
import { SUPPORTED_PAIRS } from '@/services/tradingService';
import { defaultStrategyConfig as STRATEGY_CONFIG, getAllVersions, ACTIVE_VERSION } from '@/config/strategyConfig';
const SinaisTrade = () => {
  const [selectedPairs, setSelectedPairs] = useState(['BTCUSDT', 'ETHUSDT']);
  const [allSignals, setAllSignals] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('signals');
  const audioRef = useRef({
    buy: typeof Audio !== 'undefined' ? new Audio('/sounds/buy.mp3') : null,
    sell: typeof Audio !== 'undefined' ? new Audio('/sounds/sell.mp3') : null
  });
  const handleNewSignal = signal => {
    setAllSignals(prev => [signal, ...prev].slice(0, 100));
    if (soundEnabled) {
      try {
        const soundType = signal.type === 'COMPRA' ? 'buy' : 'sell';
        audioRef.current[soundType]?.play().catch(console.log);
      } catch (e) {
        console.log('Audio não suportado');
      }
    }
    toast[signal.type === 'COMPRA' ? 'success' : 'error'](`${signal.symbol}: Sinal de ${signal.type}!`, {
      description: `Entrada: $${signal.entryPrice.toFixed(2)} | TP: $${signal.takeProfit.toFixed(2)} | SL: $${signal.stopLoss.toFixed(2)}`
    });
  };
  const togglePair = symbol => {
    setSelectedPairs(prev => {
      if (prev.includes(symbol)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== symbol);
      }
      return [...prev, symbol];
    });
  };
  const availablePairs = Object.keys(SUPPORTED_PAIRS);
  const versions = getAllVersions();
  const buySignals = allSignals.filter(s => s.type === 'COMPRA');
  const sellSignals = allSignals.filter(s => s.type === 'VENDA');
  return <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="strategy-hero border-b border-border/50">
        <div className="strategy-hero-glow" />
        <div className="relative container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <motion.div className="relative" animate={{
                scale: [1, 1.05, 1]
              }} transition={{
                duration: 2,
                repeat: Infinity
              }}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-muted flex items-center justify-center">
                    <Radio className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-background animate-pulse" />
                </motion.div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">  ​Radar de Oportunidades   </h1>
                  <p className="text-sm text-muted-foreground">
                     Setup Educacional  Multi-Ativos em Tempo Real
                  </p>
                </div>
              </div>

              {/* Version Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="version-badge version-badge-active gap-1.5">
                  <GitBranch className="w-3 h-3" />
                  Engine {ACTIVE_VERSION}
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Layers className="w-3 h-3" />
                  {selectedPairs.length} Ativos
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <BarChart3 className="w-3 h-3" />
                  M15 Timeframe
                </Badge>
              </div>
            </div>

            {/* Right Section - Stats & Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Quick Stats */}
              <div className="flex items-center gap-3">
                <div className="metric-card flex items-center gap-3 px-4 py-2">
                  <div className="flex items-center gap-1.5 text-success">
                    <ArrowUpCircle className="w-4 h-4" />
                    <span className="font-bold">{buySignals.length}</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1.5 text-danger">
                    <ArrowDownCircle className="w-4 h-4" />
                    <span className="font-bold">{sellSignals.length}</span>
                  </div>
                </div>
              </div>

              <ConnectionStatus wsConnected={true} apiStatus="ok" lastUpdate={new Date()} />
              
              {/* Sound Toggle */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                <Label htmlFor="sound" className="cursor-pointer">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-success" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3 space-y-6">
            {/* Asset Selection Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    Ativos Monitorados
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {selectedPairs.length} / {availablePairs.length} selecionados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {availablePairs.map(symbol => {
                  const pair = SUPPORTED_PAIRS[symbol];
                  const isSelected = selectedPairs.includes(symbol);
                  return <motion.div key={symbol} whileHover={{
                    scale: 1.02
                  }} whileTap={{
                    scale: 0.98
                  }}>
                        <Button variant={isSelected ? 'default' : 'outline'} size="sm" onClick={() => togglePair(symbol)} className={`gap-2 transition-all duration-200 ${isSelected ? 'shadow-md' : 'hover:border-primary/50'}`} style={isSelected ? {
                      backgroundColor: pair.color,
                      boxShadow: `0 4px 14px ${pair.color}40`
                    } : {}}>
                          <span className="text-base">{pair.icon}</span>
                          <span className="font-semibold">{pair.shortName}</span>
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        </Button>
                      </motion.div>;
                })}
                </div>
              </CardContent>
            </Card>

            {/* Signal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {selectedPairs.map((symbol, index) => <motion.div key={symbol} layout initial={{
                opacity: 0,
                y: 20,
                scale: 0.95
              }} animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }} exit={{
                opacity: 0,
                scale: 0.9,
                transition: {
                  duration: 0.2
                }
              }} transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}>
                    <CryptoSignalCard symbol={symbol} onSignal={handleNewSignal} />
                  </motion.div>)}
              </AnimatePresence>
            </div>

            {/* Strategy Info Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="text-base flex items-center gap-2 text-center">
                  <Activity className="w-4 h-4 text-primary" />
                           ​As análises compartilhadas não constituem recomendação de compra ou venda de ativos financeiros. Investimentos envolvem risco e cada operador é responsável por suas próprias decisões.                                   
                  
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Core Indicators */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Núcleo da Estratégia
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>EMA50 + HTF como filtro de tendência</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>ADX adaptativo (≥25 normal, 20-25 parcial)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Rompimento baseado em ATR (volatilidade-aware)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Volume normalizado por volatilidade</span>
                      </li>
                    </ul>
                  </div>

                  {/* Confirmations */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-info" />
                      Confirmações
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                        <span>Didi Index (agulhada de confirmação)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                        <span>RSI regime-aware (30-80 compra, 20-70 venda)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                        <span>MACD com momentum e divergência</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                        <span>TP/SL adaptativos por ADX e ATR</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Scoring Info */}
                <div className="mt-5 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4 flex-wrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-muted-foreground">Forte ≥70%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <span className="text-muted-foreground">Médio 50-69%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-danger" />
                      <span className="text-muted-foreground">Fraco &lt;50%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Signal History */}
          <div className="xl:col-span-1">
            <Card className="sticky top-24 overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Histórico
                  </CardTitle>
                  {allSignals.length > 0 && <Badge variant="secondary" className="text-xs">
                      {allSignals.length}
                    </Badge>}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full rounded-none border-b border-border/50 bg-muted/30">
                    <TabsTrigger value="all" className="flex-1 text-xs">Todos</TabsTrigger>
                    <TabsTrigger value="buy" className="flex-1 text-xs text-success">Compra</TabsTrigger>
                    <TabsTrigger value="sell" className="flex-1 text-xs text-danger">Venda</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-0">
                    <SignalList signals={allSignals} />
                  </TabsContent>
                  <TabsContent value="buy" className="mt-0">
                    <SignalList signals={buySignals} />
                  </TabsContent>
                  <TabsContent value="sell" className="mt-0">
                    <SignalList signals={sellSignals} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};

// Signal List Component
const SignalList = ({
  signals
}) => {
  if (signals.length === 0) {
    return <div className="p-8 text-center">
        <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Aguardando sinais...</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Os sinais aparecerão aqui quando detectados
        </p>
      </div>;
  }
  return <ScrollArea className="h-[500px]">
      <div className="divide-y divide-border/50">
        {signals.map((signal, idx) => {
        const pair = SUPPORTED_PAIRS[signal.symbol];
        const isBuy = signal.type === 'COMPRA';
        return <motion.div key={`${signal.symbol}-${signal.timestamp}-${idx}`} initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: idx * 0.02
        }} className={`p-3 transition-colors hover:bg-muted/50 ${isBuy ? 'border-l-2 border-l-success' : 'border-l-2 border-l-danger'}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{
                filter: `drop-shadow(0 0 4px ${pair?.color}80)`
              }}>
                    {pair?.icon}
                  </span>
                  <span className="font-semibold text-sm">{pair?.shortName || signal.symbol}</span>
                </div>
                <Badge variant={isBuy ? 'default' : 'destructive'} className="text-xs gap-1">
                  {isBuy ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                  {signal.type}
                </Badge>
              </div>
              
              {/* Price Info */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Entrada</p>
                  <p className="font-bold">${signal.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-success flex items-center gap-1 mb-0.5">
                    <Target className="w-3 h-3" /> TP
                  </p>
                  <p className="font-bold text-success">${signal.takeProfit.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-danger flex items-center gap-1 mb-0.5">
                    <Shield className="w-3 h-3" /> SL
                  </p>
                  <p className="font-bold text-danger">${signal.stopLoss.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">{signal.timestamp}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${signal.strength >= 70 ? 'bg-success' : signal.strength >= 50 ? 'bg-warning' : 'bg-danger'}`} />
                  <span className="text-xs font-semibold text-primary">
                    {signal.strength}%
                  </span>
                </div>
              </div>
              
              {/* Status Badge */}
              {signal.status && <Badge variant={signal.status === 'SUCESSO' ? 'default' : 'destructive'} className="mt-2 w-full justify-center text-xs">
                  {signal.status === 'SUCESSO' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {signal.status} {signal.profit && `(${signal.profit}%)`}
                </Badge>}
            </motion.div>;
      })}
      </div>
    </ScrollArea>;
};
export default SinaisTrade;