
import React from 'react';
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-react";

const DataSourceIndicator = ({ marketData, handleRefresh }) => {
  if (marketData?.isFallbackData) {
    return (
      <div className="flex items-center text-yellow-500 gap-2 text-sm">
        <WifiOff size={16} />
        <span>
          Usando dados locais • Última tentativa: {marketData?.lastUpdated || 'N/A'}
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 ml-2 h-auto text-primary" 
            onClick={handleRefresh}
          >
            Tentar novamente
          </Button>
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center text-green-500 gap-2 text-sm">
      <Wifi size={16} />
      <span>Dados em tempo real • Atualizado: {marketData?.lastUpdated || 'N/A'}</span>
    </div>
  );
};

export default DataSourceIndicator;
