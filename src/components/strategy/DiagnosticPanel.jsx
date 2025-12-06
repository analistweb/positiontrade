import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Copy,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { defaultStrategyConfig as STRATEGY_CONFIG } from '@/config/strategyConfig';

/**
 * Painel Inteligente de Diagnóstico
 * Exibe metadados completos para auditoria 1:1 do sinal
 */
const DiagnosticPanel = ({ 
  signal = null,
  scoreBreakdown = {},
  indicators = {},
  regime = 'unknown',
  configVersion = STRATEGY_CONFIG.version
}) => {
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = () => {
    const data = {
      signalId: signal?.id || generateSignalId(),
      timestamp: new Date().toISOString(),
      configVersion,
      regime,
      signal,
      scoreBreakdown,
      indicators
    };
    
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Diagnóstico copiado para área de transferência');
  };

  const generateSignalId = () => {
    return `SIG-${Date.now().toString(36).toUpperCase()}`;
  };

  const getDecisionBadge = () => {
    if (!signal) return null;
    
    const { totalScore, category } = scoreBreakdown;
    
    if (category === 'strong') {
      return <Badge className="bg-buy text-buy-foreground">Forte ({totalScore}%)</Badge>;
    }
    if (category === 'medium') {
      return <Badge className="bg-warning text-warning-foreground">Médio ({totalScore}%)</Badge>;
    }
    if (category === 'weak') {
      return <Badge variant="outline" className="text-muted-foreground">Fraco ({totalScore}%)</Badge>;
    }
    return <Badge variant="destructive">Rejeitado ({totalScore}%)</Badge>;
  };

  const getIndicatorStatus = (value, condition) => {
    if (condition) {
      return <CheckCircle2 className="w-3 h-3 text-buy" />;
    }
    return <XCircle className="w-3 h-3 text-sell" />;
  };

  return (
    <Card className="bg-elevated/50 border-primary/20">
      <CardHeader className="pb-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Diagnóstico do Sinal
          </CardTitle>
          <div className="flex items-center gap-2">
            {getDecisionBadge()}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); copyToClipboard(); }}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Resumo */}
        <div className="grid grid-cols-4 gap-2 text-xs mb-3">
          <div className="p-2 rounded bg-muted/50 text-center">
            <p className="text-muted-foreground">Score</p>
            <p className="font-bold text-primary">{scoreBreakdown.totalScore || 0}%</p>
          </div>
          <div className="p-2 rounded bg-muted/50 text-center">
            <p className="text-muted-foreground">Regime</p>
            <p className="font-medium capitalize">{regime}</p>
          </div>
          <div className="p-2 rounded bg-muted/50 text-center">
            <p className="text-muted-foreground">Config</p>
            <p className="font-mono text-[10px]">{configVersion}</p>
          </div>
          <div className="p-2 rounded bg-muted/50 text-center">
            <p className="text-muted-foreground">Decisão</p>
            <p className={`font-medium ${signal ? 'text-buy' : 'text-muted-foreground'}`}>
              {signal ? signal.type : 'Aguardando'}
            </p>
          </div>
        </div>

        {/* Detalhes Expandidos */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-4 border-t border-border pt-3">
                  {/* Metadados do Sinal */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Metadados
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Signal ID:</span>
                        <p className="font-mono">{signal?.id || generateSignalId()}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Input Hash:</span>
                        <p className="font-mono truncate">{scoreBreakdown.inputHash || 'N/A'}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Timestamp:</span>
                        <p>{new Date().toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">Config Version:</span>
                        <p className="font-mono">{configVersion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown do Score */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium">📊 Breakdown do Score</p>
                    <div className="space-y-1">
                      {Object.entries(scoreBreakdown.breakdown || {}).map(([key, data]) => (
                        <div 
                          key={key} 
                          className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {getIndicatorStatus(data.value, data.passed)}
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {typeof data.value === 'number' ? data.value.toFixed(2) : String(data.value)}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5">
                              +{data.points || 0} pts
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Total */}
                    <div className="flex items-center justify-between p-2 rounded bg-primary/10 text-xs font-medium">
                      <span>Total</span>
                      <span className="text-primary">{scoreBreakdown.totalScore || 0}%</span>
                    </div>
                  </div>

                  {/* Indicadores Nível 1 (Obrigatórios) */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-sell">🔴 Nível 1 - Obrigatórios</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`p-2 rounded ${indicators.breakoutValid ? 'bg-buy/10' : 'bg-sell/10'}`}>
                        {getIndicatorStatus(null, indicators.breakoutValid)}
                        <span className="ml-1">Breakout</span>
                      </div>
                      <div className={`p-2 rounded ${indicators.trendAligned ? 'bg-buy/10' : 'bg-sell/10'}`}>
                        {getIndicatorStatus(null, indicators.trendAligned)}
                        <span className="ml-1">Tendência</span>
                      </div>
                      <div className={`p-2 rounded ${indicators.candleStrength ? 'bg-buy/10' : 'bg-sell/10'}`}>
                        {getIndicatorStatus(null, indicators.candleStrength)}
                        <span className="ml-1">Candle Força</span>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores Nível 2 (Confirmações) */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-warning">🟡 Nível 2 - Confirmações</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded ${indicators.volumeConfirm ? 'bg-buy/10' : 'bg-muted/30'}`}>
                        {getIndicatorStatus(null, indicators.volumeConfirm)}
                        <span className="ml-1">Volume ({indicators.volumeRatio?.toFixed(1)}x)</span>
                      </div>
                      <div className={`p-2 rounded ${indicators.obvAligned ? 'bg-buy/10' : 'bg-muted/30'}`}>
                        {getIndicatorStatus(null, indicators.obvAligned)}
                        <span className="ml-1">OBV</span>
                      </div>
                      <div className={`p-2 rounded ${indicators.macdConfirm ? 'bg-buy/10' : 'bg-muted/30'}`}>
                        {getIndicatorStatus(null, indicators.macdConfirm)}
                        <span className="ml-1">MACD</span>
                      </div>
                      <div className={`p-2 rounded ${indicators.didiConfirm ? 'bg-buy/10' : 'bg-muted/30'}`}>
                        {getIndicatorStatus(null, indicators.didiConfirm)}
                        <span className="ml-1">Didi</span>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores Nível 3 (Situacionais) */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-buy">🟢 Nível 3 - Situacionais</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">RSI:</span>
                        <span className="ml-1 font-medium">{indicators.rsi?.toFixed(0) || 'N/A'}</span>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">ADX:</span>
                        <span className="ml-1 font-medium">{indicators.adx?.toFixed(0) || 'N/A'}</span>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">VROC:</span>
                        <span className="ml-1 font-medium">{indicators.vroc?.toFixed(1) || 'N/A'}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Razão de Aceite/Rejeição */}
                  {scoreBreakdown.reason && (
                    <div className="p-3 rounded bg-muted/30 text-xs">
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {signal ? 'Razão de Aceite' : 'Razão de Rejeição'}
                      </p>
                      <p className="text-muted-foreground">{scoreBreakdown.reason}</p>
                    </div>
                  )}

                  {/* TP/SL se houver sinal */}
                  {signal && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">🎯 Níveis de Preço</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/30 text-center">
                          <p className="text-muted-foreground">Entrada</p>
                          <p className="font-bold">${signal.entryPrice?.toFixed(2)}</p>
                        </div>
                        <div className="p-2 rounded bg-buy/10 text-center">
                          <p className="text-buy">Take Profit</p>
                          <p className="font-bold text-buy">${signal.takeProfit?.toFixed(2)}</p>
                        </div>
                        <div className="p-2 rounded bg-sell/10 text-center">
                          <p className="text-sell">Stop Loss</p>
                          <p className="font-bold text-sell">${signal.stopLoss?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DiagnosticPanel;
