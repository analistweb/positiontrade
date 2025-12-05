import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Triângulo de Confluência
 * Mostra tendência + volume + momentum com transparência total
 */
const ConfluenceTriangle = ({ 
  trendScore = 0, 
  volumeScore = 0, 
  momentumScore = 0,
  details = {}
}) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-buy bg-buy/10 border-buy/30';
    if (score >= 50) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-sell bg-sell/10 border-sell/30';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Forte';
    if (score >= 50) return 'Médio';
    return 'Fraco';
  };

  const getStatusIcon = (score) => {
    if (score >= 70) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  };

  const totalScore = Math.round((trendScore + volumeScore + momentumScore) / 3);

  return (
    <Card className="bg-elevated/50">
      <CardHeader className="pb-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Triângulo de Confluência
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getScoreColor(totalScore)}>
              Score Total: {totalScore}%
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Triângulo Visual */}
        <div className="flex justify-center">
          <div className="relative w-48 h-40">
            {/* SVG do Triângulo */}
            <svg viewBox="0 0 200 180" className="w-full h-full">
              {/* Triângulo de fundo */}
              <polygon
                points="100,10 10,170 190,170"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
              />
              
              {/* Preenchimento baseado em scores */}
              <polygon
                points="100,10 10,170 190,170"
                fill={`url(#gradient-${totalScore >= 70 ? 'green' : totalScore >= 50 ? 'yellow' : 'red'})`}
                opacity="0.3"
              />
              
              {/* Gradientes */}
              <defs>
                <linearGradient id="gradient-green" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--buy))" />
                  <stop offset="100%" stopColor="hsl(var(--buy))" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="gradient-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--warning))" />
                  <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="gradient-red" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--sell))" />
                  <stop offset="100%" stopColor="hsl(var(--sell))" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Labels nos vértices */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center cursor-help">
                    <div className={`p-2 rounded-full ${getScoreColor(trendScore)} border`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-xs mt-1 font-medium">{trendScore}%</p>
                    <p className="text-[10px] text-muted-foreground">Tendência</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium mb-1">Tendência {getStatusIcon(trendScore)} {getScoreLabel(trendScore)}</p>
                  <ul className="text-xs space-y-0.5">
                    <li>EMA50: {details.ema50Aligned ? '✓' : '✗'} Alinhada</li>
                    <li>HTF: {details.htfAligned ? '✓' : '✗'} Confirmado</li>
                    <li>VWAP: {details.vwapAligned ? '✓' : '✗'} Favorável</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute bottom-0 left-2 text-center cursor-help">
                    <div className={`p-2 rounded-full ${getScoreColor(volumeScore)} border`}>
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <p className="text-xs mt-1 font-medium">{volumeScore}%</p>
                    <p className="text-[10px] text-muted-foreground">Volume</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium mb-1">Volume {getStatusIcon(volumeScore)} {getScoreLabel(volumeScore)}</p>
                  <ul className="text-xs space-y-0.5">
                    <li>Ratio: {details.volumeRatio?.toFixed(2) || 'N/A'}x média</li>
                    <li>OBV: {details.obvAligned ? '✓' : '✗'} Alinhado</li>
                    <li>VROC: {details.vrocPositive ? '✓' : '✗'} Positivo</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute bottom-0 right-2 text-center cursor-help">
                    <div className={`p-2 rounded-full ${getScoreColor(momentumScore)} border`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <p className="text-xs mt-1 font-medium">{momentumScore}%</p>
                    <p className="text-[10px] text-muted-foreground">Momentum</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-medium mb-1">Momentum {getStatusIcon(momentumScore)} {getScoreLabel(momentumScore)}</p>
                  <ul className="text-xs space-y-0.5">
                    <li>RSI: {details.rsi?.toFixed(0) || 'N/A'}</li>
                    <li>MACD: {details.macdGrowing ? '✓' : '✗'} Crescendo</li>
                    <li>ADX: {details.adx?.toFixed(0) || 'N/A'}</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Score central */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`text-2xl font-bold ${totalScore >= 70 ? 'text-buy' : totalScore >= 50 ? 'text-warning' : 'text-sell'}`}
              >
                {totalScore}%
              </motion.div>
              <p className="text-xs text-muted-foreground">{getScoreLabel(totalScore)}</p>
            </div>
          </div>
        </div>
        
        {/* Detalhes Expandidos */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2 border-t border-border"
            >
              {/* Breakdown de Tendência */}
              <div className="space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Tendência ({trendScore}%)
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded ${details.ema50Aligned ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    EMA50: {details.ema50Aligned ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${details.htfAligned ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    HTF: {details.htfAligned ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${details.vwapAligned ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    VWAP: {details.vwapAligned ? '✓' : '✗'}
                  </div>
                </div>
              </div>
              
              {/* Breakdown de Volume */}
              <div className="space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Volume ({volumeScore}%)
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded ${details.volumeAboveAvg ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    Volume: {details.volumeRatio?.toFixed(1) || '0'}x
                  </div>
                  <div className={`p-2 rounded ${details.obvAligned ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    OBV: {details.obvAligned ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${details.vrocPositive ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    VROC: {details.vrocPositive ? '✓' : '✗'}
                  </div>
                </div>
              </div>
              
              {/* Breakdown de Momentum */}
              <div className="space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Momentum ({momentumScore}%)
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded ${details.rsiValid ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    RSI: {details.rsi?.toFixed(0) || 'N/A'}
                  </div>
                  <div className={`p-2 rounded ${details.macdGrowing ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    MACD: {details.macdGrowing ? '↑' : '↓'}
                  </div>
                  <div className={`p-2 rounded ${details.adx >= 25 ? 'bg-buy/10 text-buy' : 'bg-muted'}`}>
                    ADX: {details.adx?.toFixed(0) || 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Pesos */}
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                <p className="font-medium mb-1">Pesos do Score:</p>
                <p>Tendência: 35% | Volume: 30% | Momentum: 35%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ConfluenceTriangle;
