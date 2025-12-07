import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  Clock,
  BarChart3,
  Activity,
  BookOpen,
  Zap
} from "lucide-react";

const StrategyStep = ({ number, title, description, icon: Icon, color, isActive }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: number * 0.1 }}
    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
      isActive 
        ? 'border-primary/50 bg-primary/5' 
        : 'border-border/30 bg-card/50 hover:border-border/50'
    }`}
  >
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-muted-foreground">PASSO {number}</span>
      </div>
      <h4 className="font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const IndicatorExplanation = ({ name, description, bullish, bearish, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/30"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h4 className="font-semibold text-foreground">{name}</h4>
    </div>
    <p className="text-sm text-muted-foreground mb-3">{description}</p>
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-buy/10 border border-buy/20">
        <TrendingUp className="w-4 h-4 text-buy" />
        <span className="text-xs text-buy font-medium">{bullish}</span>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-lg bg-sell/10 border border-sell/20">
        <TrendingDown className="w-4 h-4 text-sell" />
        <span className="text-xs text-sell font-medium">{bearish}</span>
      </div>
    </div>
  </motion.div>
);

const StrategyEducation = ({ currentRSI, isExpanded = false }) => {
  const [expanded, setExpanded] = useState(isExpanded);
  
  const getRSISignal = () => {
    if (currentRSI <= 30) return { type: 'buy', label: 'Sobrevendido', color: 'text-buy' };
    if (currentRSI >= 70) return { type: 'sell', label: 'Sobrecomprado', color: 'text-sell' };
    return { type: 'neutral', label: 'Neutro', color: 'text-muted-foreground' };
  };

  const rsiSignal = getRSISignal();

  const steps = [
    {
      number: 1,
      title: "Analise o RSI",
      description: "RSI abaixo de 30 indica momento de COMPRA (sobrevendido). Acima de 70 indica momento de VENDA (sobrecomprado).",
      icon: Activity,
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      number: 2,
      title: "Confirme com EMA",
      description: "Se preço está acima da EMA de 56 dias E rompendo máxima semanal, confirma tendência de alta.",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600"
    },
    {
      number: 3,
      title: "Verifique o Volume",
      description: "Volume alto confirma o movimento. Volume baixo pode indicar falso rompimento.",
      icon: BarChart3,
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      number: 4,
      title: "Execute com Gestão de Risco",
      description: "Use stop-loss de 3-5% abaixo do preço de entrada. Take profit com relação risco/retorno de 1:2.",
      icon: Shield,
      color: "bg-gradient-to-br from-amber-500 to-amber-600"
    }
  ];

  const indicators = [
    {
      name: "RSI (Índice de Força Relativa)",
      description: "Mede a velocidade e magnitude das mudanças de preço. Oscila entre 0 e 100.",
      bullish: "RSI < 30",
      bearish: "RSI > 70",
      icon: Activity
    },
    {
      name: "EMA (Média Móvel Exponencial)",
      description: "Média que dá mais peso aos preços recentes. Usamos a EMA de 56 períodos.",
      bullish: "Preço > EMA",
      bearish: "Preço < EMA",
      icon: TrendingUp
    },
    {
      name: "Volume de Negociação",
      description: "Quantidade de ativos negociados. Alto volume confirma movimentos de preço.",
      bullish: "Volume crescente",
      bearish: "Volume decrescente",
      icon: BarChart3
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Hero Card - Sempre visível */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <Lightbulb className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Estratégia DCA Inteligente</CardTitle>
                <p className="text-sm text-muted-foreground">Baseada em RSI + EMA + Volume</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 border-primary/30">
              <Zap className="w-3 h-3 mr-1" />
              Ativa
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Current Signal */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/30">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              rsiSignal.type === 'buy' ? 'bg-buy/10' :
              rsiSignal.type === 'sell' ? 'bg-sell/10' : 'bg-muted/20'
            }`}>
              <span className={`text-2xl font-bold ${rsiSignal.color}`}>
                {currentRSI?.toFixed(0) || '--'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">RSI Atual</p>
              <div className="flex items-center gap-2">
                <Badge className={`${
                  rsiSignal.type === 'buy' ? 'bg-buy/20 text-buy border-buy/30' :
                  rsiSignal.type === 'sell' ? 'bg-sell/20 text-sell border-sell/30' : 
                  'bg-muted/20 text-muted-foreground border-muted/30'
                }`}>
                  {rsiSignal.label}
                </Badge>
                {rsiSignal.type === 'buy' && (
                  <span className="text-sm text-buy font-medium">Momento favorável para DCA</span>
                )}
                {rsiSignal.type === 'sell' && (
                  <span className="text-sm text-sell font-medium">Considere realizar lucros</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-buy/5 border border-buy/20">
              <DollarSign className="w-5 h-5 text-buy" />
              <div>
                <p className="text-xs text-muted-foreground">Zona de Compra</p>
                <p className="text-sm font-semibold text-buy">RSI &lt; 30</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Zona Neutra</p>
                <p className="text-sm font-semibold">30 - 70</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sell/5 border border-sell/20">
              <Target className="w-5 h-5 text-sell" />
              <div>
                <p className="text-xs text-muted-foreground">Zona de Venda</p>
                <p className="text-sm font-semibold text-sell">RSI &gt; 70</p>
              </div>
            </div>
          </div>

          {/* Expand Button */}
          <Button
            variant="ghost"
            className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            <BookOpen className="w-4 h-4" />
            {expanded ? 'Ocultar guia completo' : 'Ver guia completo da estratégia'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardContent>
      </Card>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Strategy Steps */}
            <Card className="border-border/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Como Usar Esta Estratégia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, index) => (
                  <StrategyStep 
                    key={step.number} 
                    {...step} 
                    isActive={
                      (step.number === 1 && currentRSI <= 30) ||
                      (step.number === 1 && currentRSI >= 70)
                    }
                  />
                ))}
              </CardContent>
            </Card>

            {/* Indicator Explanations */}
            <Card className="border-border/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Entenda os Indicadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {indicators.map((indicator, index) => (
                    <IndicatorExplanation key={index} {...indicator} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-500">
                  <Lightbulb className="w-5 h-5" />
                  Dicas dos Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/50 border border-amber-500/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      Gestão de Risco
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Nunca invista mais de 5% do portfolio em uma única operação</li>
                      <li>• Use stop-loss sempre para proteger seu capital</li>
                      <li>• DCA (Dollar Cost Averaging) reduz risco de timing</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-amber-500/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Melhor Momento
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Compre quando RSI &lt; 30 por múltiplos dias</li>
                      <li>• Confirme com volume acima da média</li>
                      <li>• Domingo à noite geralmente tem menor volatilidade</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StrategyEducation;
