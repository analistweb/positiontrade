
import React from 'react';
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Database, Clock } from "lucide-react";
import { motion } from "framer-motion";

const DataSourceIndicator = ({ marketData, handleRefresh }) => {
  // Verifica quando foi a última atualização
  const getTimeDifference = () => {
    if (!marketData?.lastUpdated) return 'N/A';
    
    const lastUpdate = new Date(marketData.lastUpdated);
    const now = new Date();
    
    // Se for de hoje, mostrar apenas a hora
    if (lastUpdate.toDateString() === now.toDateString()) {
      return lastUpdate.toLocaleTimeString();
    }
    
    // Caso contrário, mostrar a data completa
    return lastUpdate.toLocaleString();
  };
  
  if (marketData?.isFallbackData) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center text-yellow-500 gap-2 text-sm p-2 bg-yellow-500/10 rounded-md"
      >
        <WifiOff size={16} />
        <span className="flex-1">
          Usando dados locais • Última tentativa: {getTimeDifference()}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs border-yellow-500 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100" 
          onClick={handleRefresh}
        >
          <RefreshIcon className="mr-1 h-3 w-3" />
          Tentar novamente
        </Button>
      </motion.div>
    );
  }
  
  if (marketData?.isFromCache) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center text-blue-500 gap-2 text-sm p-2 bg-blue-500/10 rounded-md"
      >
        <Database size={16} />
        <span className="flex-1">
          Dados em cache • Atualizado: {getTimeDifference()}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs border-blue-500 text-blue-500 hover:text-blue-600 hover:bg-blue-100" 
          onClick={handleRefresh}
        >
          <RefreshIcon className="mr-1 h-3 w-3" />
          Atualizar agora
        </Button>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center text-green-500 gap-2 text-sm p-2 bg-green-500/10 rounded-md"
    >
      <Wifi size={16} />
      <span>Dados em tempo real • Atualizado: {getTimeDifference()}</span>
    </motion.div>
  );
};

// Componente de ícone separado para evitar duplicação
const RefreshIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7l3-3" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7l-3 3" />
  </svg>
);

export default DataSourceIndicator;
