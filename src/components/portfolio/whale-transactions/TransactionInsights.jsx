
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Building, 
  Wallet, 
  PieChart, 
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';

const TransactionInsights = ({ transactions, dataSource = 'exchange' }) => {
  if (!transactions?.length) return null;

  // Calcular tendência dominante
  const buyCount = transactions.filter(tx => tx.type === "Compra").length;
  const sellCount = transactions.filter(tx => tx.type === "Venda").length;
  const dominantTrend = buyCount > sellCount ? "Acumulação" : "Distribuição";
  
  // Calcular volume total e médio
  const totalVolume = transactions.reduce((acc, tx) => acc + tx.volume, 0);
  const averageVolume = totalVolume / transactions.length;
  
  // Agrupar por símbolo
  const symbolGroups = transactions.reduce((acc, tx) => {
    if (!acc[tx.cryptoSymbol]) {
      acc[tx.cryptoSymbol] = {
        count: 0,
        volume: 0,
        buys: 0,
        sells: 0
      };
    }
    
    acc[tx.cryptoSymbol].count += 1;
    acc[tx.cryptoSymbol].volume += tx.volume;
    
    if (tx.type === "Compra") {
      acc[tx.cryptoSymbol].buys += 1;
    } else {
      acc[tx.cryptoSymbol].sells += 1;
    }
    
    return acc;
  }, {});
  
  // Encontrar o símbolo mais movimentado
  const topSymbol = Object.entries(symbolGroups)
    .sort((a, b) => b[1].volume - a[1].volume)[0];
    
  // Para dados on-chain, calcular estatísticas de origem/destino
  let entityStats = null;
  if (dataSource === 'onchain') {
    // Contar transações por entidade (origem/destino)
    const entityCounts = transactions.reduce((acc, tx) => {
      const fromName = tx.fromName || "Desconhecido";
      const toName = tx.destinationName || "Desconhecido";
      
      if (!acc[fromName]) acc[fromName] = { sends: 0, receives: 0, volume: 0 };
      if (!acc[toName]) acc[toName] = { sends: 0, receives: 0, volume: 0 };
      
      acc[fromName].sends += 1;
      acc[toName].receives += 1;
      acc[fromName].volume += tx.volume;
      
      return acc;
    }, {});
    
    // Encontrar entidades mais ativas
    const topSender = Object.entries(entityCounts)
      .sort((a, b) => b[1].sends - a[1].sends)[0];
      
    const topReceiver = Object.entries(entityCounts)
      .sort((a, b) => b[1].receives - a[1].receives)[0];
      
    entityStats = {
      topSender: topSender ? topSender[0] : "Desconhecido",
      topReceiver: topReceiver ? topReceiver[0] : "Desconhecido",
      uniqueEntities: Object.keys(entityCounts).length
    };
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Análise de Comportamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Tendência Dominante</p>
            </div>
            <p className="text-2xl font-bold text-primary flex items-center mt-1">
              {dominantTrend === "Acumulação" ? 
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" /> : 
                <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
              }
              {dominantTrend}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado nas últimas {transactions.length} transações
            </p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Volume Médio</p>
            </div>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {formatCurrency(averageVolume)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(totalVolume)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Movimentações por Criptomoeda</h3>
        <div className="space-y-2">
          {Object.entries(symbolGroups)
            .sort((a, b) => b[1].volume - a[1].volume)
            .slice(0, 3)
            .map(([symbol, data], index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
                <div>
                  <p className="font-medium">{symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(data.volume)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {data.buys}
                  </Badge>
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> {data.sells}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </Card>
      
      {dataSource === 'onchain' && entityStats && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Análise de Entidades</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-primary/5">
              <p className="text-sm font-medium">Principal Originador</p>
              <p className="text-lg font-bold text-primary flex items-center mt-1">
                <Building className="h-4 w-4 mr-2" />
                {entityStats.topSender}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5">
              <p className="text-sm font-medium">Principal Receptor</p>
              <p className="text-lg font-bold text-primary flex items-center mt-1">
                <Wallet className="h-4 w-4 mr-2" />
                {entityStats.topReceiver}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5">
              <p className="text-sm font-medium">Entidades Únicas</p>
              <p className="text-lg font-bold text-primary">{entityStats.uniqueEntities}</p>
            </div>
          </div>
        </Card>
      )}
      
      <div className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        <span>
          Dados obtidos de fontes públicas. Utilize apenas como referência.
        </span>
      </div>
    </div>
  );
};

export default TransactionInsights;
