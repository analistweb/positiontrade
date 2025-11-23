import React from 'react';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const showSignalNotification = (signal, type = 'new') => {
  const isBuy = signal.type === 'COMPRA';
  
  if (type === 'new') {
    // Notificação de novo sinal
    toast.custom(
      (t) => (
        <div className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
          isBuy ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
        } shadow-lg backdrop-blur-sm`}>
          <div className={`p-2 rounded-full ${
            isBuy ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {isBuy ? (
              <TrendingUp className="w-5 h-5 text-white" />
            ) : (
              <TrendingDown className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1">
              {isBuy ? '🟢 Novo Sinal de COMPRA' : '🔴 Novo Sinal de VENDA'}
            </p>
            <div className="text-xs space-y-1 text-foreground/80">
              <p>Entrada: <span className="font-bold">${signal.entryPrice.toFixed(2)}</span></p>
              <p>Alvo: <span className="font-bold text-green-500">${signal.takeProfit.toFixed(2)}</span></p>
              <p>Stop: <span className="font-bold text-red-500">${signal.stopLoss.toFixed(2)}</span></p>
              <p>R:R: <span className="font-bold">1:{signal.riskReward}</span></p>
            </div>
            {signal.confirmations && signal.confirmations.marketStrength && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-xs">
                  Força do Mercado: <span className="font-bold">{signal.confirmations.marketStrength.toFixed(0)}/100</span>
                </p>
              </div>
            )}
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: 'top-right',
      }
    );
  } else if (type === 'tp') {
    // Notificação de Take Profit atingido
    toast.custom(
      (t) => (
        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-green-500 bg-green-500/10 shadow-lg backdrop-blur-sm">
          <div className="p-2 rounded-full bg-green-500">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1">🎯 Take Profit Atingido!</p>
            <div className="text-xs space-y-1 text-foreground/80">
              <p>Tipo: <span className="font-bold">{signal.type}</span></p>
              <p>Entrada: <span className="font-bold">${signal.entryPrice.toFixed(2)}</span></p>
              <p>Saída: <span className="font-bold">${signal.takeProfit.toFixed(2)}</span></p>
              <p className="text-green-500 font-bold text-base mt-1">
                Lucro: +{signal.profit}%
              </p>
            </div>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: 'top-right',
      }
    );
  } else if (type === 'sl') {
    // Notificação de Stop Loss atingido
    toast.custom(
      (t) => (
        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-500 bg-red-500/10 shadow-lg backdrop-blur-sm">
          <div className="p-2 rounded-full bg-red-500">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1">🛑 Stop Loss Atingido</p>
            <div className="text-xs space-y-1 text-foreground/80">
              <p>Tipo: <span className="font-bold">{signal.type}</span></p>
              <p>Entrada: <span className="font-bold">${signal.entryPrice.toFixed(2)}</span></p>
              <p>Saída: <span className="font-bold">${signal.stopLoss.toFixed(2)}</span></p>
              <p className="text-red-500 font-bold text-base mt-1">
                Perda: {signal.profit}%
              </p>
            </div>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: 'top-right',
      }
    );
  }
};

export const showMarketConditionAlert = (condition) => {
  toast.custom(
    (t) => (
      <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-yellow-500 bg-yellow-500/10 shadow-lg backdrop-blur-sm">
        <div className="p-2 rounded-full bg-yellow-500">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm mb-1">⚠️ Alerta de Condições</p>
          <p className="text-xs text-foreground/80">{condition}</p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-right',
    }
  );
};

export default {
  showSignalNotification,
  showMarketConditionAlert
};
