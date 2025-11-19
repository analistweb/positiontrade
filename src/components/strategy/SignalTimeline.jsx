import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Trophy, Clock } from 'lucide-react';

const SignalCard = ({ signal, index, isSuccess = false }) => {
  const isBuy = signal.type === 'COMPRA';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative pl-8 pb-6 border-l-2 ${
        isSuccess 
          ? 'border-green-500' 
          : isBuy 
            ? 'border-blue-500' 
            : 'border-red-500'
      }`}
    >
      {/* Timeline dot */}
      <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${
        isSuccess 
          ? 'bg-green-500' 
          : isBuy 
            ? 'bg-blue-500' 
            : 'bg-red-500'
      } border-4 border-background`} />
      
      <div className="bg-card/50 border border-border/50 rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-all">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <Trophy className="w-4 h-4 text-green-500" />
            ) : isBuy ? (
              <ArrowUpCircle className="w-4 h-4 text-blue-500" />
            ) : (
              <ArrowDownCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="font-semibold text-sm sm:text-base">
              {signal.type}
            </span>
          </div>
          {isSuccess && (
            <Badge className="bg-green-500 text-white">
              +{signal.profit}%
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
          <div>
            <p className="text-muted-foreground">Entrada</p>
            <p className="font-medium">${signal.entryPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Alvo</p>
            <p className="font-medium text-green-500">${signal.takeProfit.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{signal.timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
};

const SignalTimeline = ({ signals, successfulSignals }) => {
  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      {/* Successful Signals */}
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-500" />
            Sinais Bem-Sucedidos ({successfulSignals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {successfulSignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum sinal completado ainda</p>
            </div>
          ) : (
            <div className="space-y-0">
              {successfulSignals.slice(0, 5).map((signal, index) => (
                <SignalCard 
                  key={`success-${signal.timestamp}`} 
                  signal={signal} 
                  index={index}
                  isSuccess={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Signals */}
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico Recente ({signals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aguardando sinais...</p>
            </div>
          ) : (
            <div className="space-y-0">
              {signals.slice(0, 5).map((signal, index) => (
                <SignalCard 
                  key={`history-${signal.timestamp}`} 
                  signal={signal} 
                  index={index}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignalTimeline;
