
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';

const TransactionInsights = ({ transactions }) => {
  if (!transactions?.length) return null;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Análise de Comportamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/5">
            <p className="text-sm font-medium">Tendência Dominante</p>
            <p className="text-2xl font-bold text-primary">
              {transactions.filter(tx => tx.type === "Compra").length > 
               transactions.filter(tx => tx.type === "Venda").length 
               ? "Acumulação" : "Distribuição"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado nas últimas {transactions.length} transações
            </p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5">
            <p className="text-sm font-medium">Volume Médio</p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(
                transactions.reduce((acc, tx) => acc + tx.volume, 0) / 
                transactions.length
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Média por transação
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Principais Movimentações</h3>
        <div className="space-y-2">
          {transactions.slice(0, 3).map((tx, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
              <div>
                <p className="font-medium">{tx.destination === "Carteira" ? "Carteira Privada" : tx.exchange}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(tx.volume)}
                </p>
              </div>
              <Badge variant={tx.type === "Compra" ? "success" : "destructive"}>
                {tx.type}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TransactionInsights;
