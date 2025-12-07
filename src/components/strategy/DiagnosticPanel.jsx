import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Copy,
  Hash,
  AlertTriangle,
  Target,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { defaultStrategyConfig as STRATEGY_CONFIG } from '@/config/strategyConfig';

/**
 * Painel Inteligente de Diagnóstico
 * Exibe score detalhado e motivo de rejeição/aceite do sinal
 */
const DiagnosticPanel = ({ 
  signal = null,
  conditionsStatus = null,
  parameters = { scoreThreshold: 60 },
  configVersion = STRATEGY_CONFIG.version
}) => {
  const [expanded, setExpanded] = useState(true); // Aberto por padrão

  const copyToClipboard = () => {
    const data = {
      signalId: signal?.id || generateSignalId(),
      timestamp: new Date().toISOString(),
      configVersion,
      conditionsStatus,
      signal,
      parameters
    };
    
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Diagnóstico copiado para área de transferência');
  };

  const generateSignalId = () => {
    return `SIG-${Date.now().toString(36).toUpperCase()}`;
  };

  // Calcular score e status baseado nas condições
  const calculateScoreBreakdown = () => {
    if (!conditionsStatus) return null;
    
    const direction = conditionsStatus.direction || 'buy';
    const conditions = conditionsStatus[direction] || conditionsStatus.buy;
    
    // Pesos conforme strategyConfig
    const breakdown = {
      // Nível 1 - Obrigatórios (45 pts max)
      breakout: {
        label: 'Rompimento',
        weight: 20,
        passed: conditions.breakout,
        points: conditions.breakout ? 20 : 0,
        level: 1
      },
      trend: {
        label: 'Tendência (EMA50)',
        weight: 15,
        passed: conditions.trend,
        points: conditions.trend ? 15 : 0,
        level: 1
      },
      volatility: {
        label: 'Volatilidade (ATR)',
        weight: 10,
        passed: conditions.volatility,
        points: conditions.volatility ? 10 : 0,
        level: 1
      },
      // Nível 2 - Confirmações (45 pts max)
      volume: {
        label: 'Volume',
        weight: 15,
        passed: conditions.volume,
        points: conditions.volume ? 15 : 0,
        level: 2
      },
      obv: {
        label: 'OBV',
        weight: 10,
        passed: conditions.obv,
        points: conditions.obv ? 10 : 0,
        level: 2
      },
      macd: {
        label: 'MACD',
        weight: 15,
        passed: conditions.macd,
        points: conditions.macd ? 15 : 0,
        level: 2
      },
      didi: {
        label: 'Didi Index',
        weight: 5,
        passed: conditions.didi,
        points: conditions.didi ? 5 : 0,
        level: 2
      },
      // Nível 3 - Situacionais (10 pts max)
      rsi: {
        label: 'RSI',
        weight: 5,
        passed: conditions.rsi,
        points: conditions.rsi ? 5 : 0,
        level: 3
      },
      dmi: {
        label: 'DMI/ADX',
        weight: 5,
        passed: conditions.dmi,
        points: conditions.dmi ? 5 : 0,
        level: 3
      }
    };

    const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.points, 0);
    const maxScore = Object.values(breakdown).reduce((sum, item) => sum + item.weight, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Identificar bloqueadores
    const blockers = [];
    
    if (!conditions.breakout) {
      blockers.push('Sem rompimento válido');
    }
    if (!conditions.rrValid && conditions.breakout) {
      blockers.push('Risco/Retorno inválido (< 1:1)');
    }
    if (percentage < parameters.scoreThreshold) {
      blockers.push(`Score ${percentage}% abaixo do mínimo (${parameters.scoreThreshold}%)`);
    }
    
    // Pontos faltantes para atingir threshold
    const pointsNeeded = Math.max(0, Math.ceil((parameters.scoreThreshold / 100) * maxScore) - totalScore);

    return {
      breakdown,
      totalScore,
      maxScore,
      percentage,
      threshold: parameters.scoreThreshold,
      passesThreshold: percentage >= parameters.scoreThreshold,
      blockers,
      pointsNeeded,
      rrValid: conditions.rrValid,
      rrRatio: conditionsStatus.rrRatio
    };
  };

  const scoreData = calculateScoreBreakdown();

  const getScoreColor = (percentage, threshold) => {
    if (percentage >= threshold) return 'text-buy';
    if (percentage >= threshold * 0.8) return 'text-warning';
    return 'text-sell';
  };

  const getScoreBadge = () => {
    if (!scoreData) return null;
    
    const { percentage, threshold, passesThreshold } = scoreData;
    
    if (passesThreshold && conditionsStatus?.buy?.rrValid) {
      return <Badge className="bg-buy text-buy-foreground">✅ Aprovado ({percentage}%)</Badge>;
    }
    return <Badge variant="destructive">❌ Rejeitado ({percentage}%)</Badge>;
  };

  const getIndicatorIcon = (passed) => {
    if (passed) {
      return <CheckCircle2 className="w-4 h-4 text-buy flex-shrink-0" />;
    }
    return <XCircle className="w-4 h-4 text-sell flex-shrink-0" />;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 1: return 'border-l-sell';
      case 2: return 'border-l-warning';
      case 3: return 'border-l-buy';
      default: return 'border-l-muted';
    }
  };

  if (!conditionsStatus) return null;

  return (
    <Card className="bg-elevated/50 border-primary/20">
      <CardHeader className="pb-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Diagnóstico do Score
          </CardTitle>
          <div className="flex items-center gap-2">
            {getScoreBadge()}
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
        {scoreData && (
          <>
            {/* Barra de Score Visual */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Score Total</span>
                <span className={`text-sm font-bold ${getScoreColor(scoreData.percentage, scoreData.threshold)}`}>
                  {scoreData.totalScore} / {scoreData.maxScore} pts ({scoreData.percentage}%)
                </span>
              </div>
              <div className="relative">
                <Progress value={scoreData.percentage} className="h-3" />
                {/* Linha do threshold */}
                <div 
                  className="absolute top-0 h-full w-0.5 bg-primary z-10"
                  style={{ left: `${scoreData.threshold}%` }}
                />
                <div 
                  className="absolute -top-4 text-[10px] text-primary font-medium"
                  style={{ left: `${scoreData.threshold}%`, transform: 'translateX(-50%)' }}
                >
                  Mín: {scoreData.threshold}%
                </div>
              </div>
            </div>

            {/* Bloqueadores - Mostrar sempre se houver */}
            {scoreData.blockers.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-sell/10 border border-sell/30">
                <p className="text-xs font-medium text-sell flex items-center gap-1 mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  Motivo da Rejeição:
                </p>
                <ul className="space-y-1">
                  {scoreData.blockers.map((blocker, idx) => (
                    <li key={idx} className="text-xs text-sell/80 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-sell" />
                      {blocker}
                    </li>
                  ))}
                </ul>
                {scoreData.pointsNeeded > 0 && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    Faltam <span className="font-bold text-primary">{scoreData.pointsNeeded} pontos</span> para atingir o threshold.
                  </p>
                )}
              </div>
            )}

            {/* R:R Status */}
            <div className="mb-4 p-2 rounded bg-muted/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Risco/Retorno
              </span>
              <Badge variant={scoreData.rrValid ? "default" : "destructive"} className="text-xs">
                {scoreData.rrValid ? '✅' : '❌'} {scoreData.rrRatio?.toFixed(2) || 'N/A'}:1
              </Badge>
            </div>

            {/* Detalhes Expandidos */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ScrollArea className="h-[350px] pr-2">
                    <div className="space-y-3">
                      {/* Nível 1 - Obrigatórios */}
                      <div>
                        <p className="text-xs font-medium mb-2 text-sell flex items-center gap-1">
                          🔴 Nível 1 - Obrigatórios (máx 45 pts)
                        </p>
                        <div className="space-y-1">
                          {Object.entries(scoreData.breakdown)
                            .filter(([_, item]) => item.level === 1)
                            .map(([key, item]) => (
                              <div 
                                key={key}
                                className={`flex items-center justify-between p-2 rounded border-l-2 ${getLevelColor(1)} bg-muted/20`}
                              >
                                <div className="flex items-center gap-2">
                                  {getIndicatorIcon(item.passed)}
                                  <span className="text-xs">{item.label}</span>
                                </div>
                                <Badge 
                                  variant={item.passed ? "default" : "outline"} 
                                  className={`text-[10px] ${item.passed ? 'bg-buy/20 text-buy' : 'bg-sell/20 text-sell'}`}
                                >
                                  {item.passed ? `+${item.points}` : '0'} / {item.weight} pts
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Nível 2 - Confirmações */}
                      <div>
                        <p className="text-xs font-medium mb-2 text-warning flex items-center gap-1">
                          🟡 Nível 2 - Confirmações (máx 45 pts)
                        </p>
                        <div className="space-y-1">
                          {Object.entries(scoreData.breakdown)
                            .filter(([_, item]) => item.level === 2)
                            .map(([key, item]) => (
                              <div 
                                key={key}
                                className={`flex items-center justify-between p-2 rounded border-l-2 ${getLevelColor(2)} bg-muted/20`}
                              >
                                <div className="flex items-center gap-2">
                                  {getIndicatorIcon(item.passed)}
                                  <span className="text-xs">{item.label}</span>
                                </div>
                                <Badge 
                                  variant={item.passed ? "default" : "outline"} 
                                  className={`text-[10px] ${item.passed ? 'bg-buy/20 text-buy' : 'bg-sell/20 text-sell'}`}
                                >
                                  {item.passed ? `+${item.points}` : '0'} / {item.weight} pts
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Nível 3 - Situacionais */}
                      <div>
                        <p className="text-xs font-medium mb-2 text-buy flex items-center gap-1">
                          🟢 Nível 3 - Situacionais (máx 10 pts)
                        </p>
                        <div className="space-y-1">
                          {Object.entries(scoreData.breakdown)
                            .filter(([_, item]) => item.level === 3)
                            .map(([key, item]) => (
                              <div 
                                key={key}
                                className={`flex items-center justify-between p-2 rounded border-l-2 ${getLevelColor(3)} bg-muted/20`}
                              >
                                <div className="flex items-center gap-2">
                                  {getIndicatorIcon(item.passed)}
                                  <span className="text-xs">{item.label}</span>
                                </div>
                                <Badge 
                                  variant={item.passed ? "default" : "outline"} 
                                  className={`text-[10px] ${item.passed ? 'bg-buy/20 text-buy' : 'bg-sell/20 text-sell'}`}
                                >
                                  {item.passed ? `+${item.points}` : '0'} / {item.weight} pts
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Valores dos Indicadores */}
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-xs font-medium mb-2 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Valores Atuais
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-muted-foreground">RSI</p>
                            <p className="font-bold">{conditionsStatus.rsi?.toFixed(1) || 'N/A'}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-muted-foreground">ADX</p>
                            <p className="font-bold">{conditionsStatus.adx?.toFixed(1) || 'N/A'}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-muted-foreground">ATR</p>
                            <p className="font-bold">{conditionsStatus.atrValue?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-muted-foreground">Vol Ratio</p>
                            <p className="font-bold">
                              {conditionsStatus.avgVolume ? 
                                (conditionsStatus.currentVolume / conditionsStatus.avgVolume).toFixed(2) + 'x' : 
                                'N/A'
                              }
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-muted-foreground">MACD</p>
                            <p className={`font-bold ${conditionsStatus.macdValue > 0 ? 'text-buy' : 'text-sell'}`}>
                              {conditionsStatus.macdValue?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-muted-foreground">OBV</p>
                            <p className={`font-bold ${conditionsStatus.obvTrend === 'up' ? 'text-buy' : 'text-sell'}`}>
                              {conditionsStatus.obvTrend === 'up' ? '📈' : '📉'} {conditionsStatus.obvTrend || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Config Version */}
                      <div className="mt-2 text-[10px] text-muted-foreground text-center">
                        Config: {configVersion} | Threshold: {parameters.scoreThreshold}%
                      </div>
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosticPanel;
