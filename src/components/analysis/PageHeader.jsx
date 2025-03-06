
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import DataSourceIndicator from './DataSourceIndicator';

const PageHeader = ({ handleRefresh, marketData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Análise de Compra e Venda</h1>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleRefresh}
          title="Atualizar dados"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Indicador de fonte de dados */}
      <div className="mb-4">
        <DataSourceIndicator 
          marketData={marketData} 
          handleRefresh={handleRefresh} 
        />
      </div>
    </motion.div>
  );
};

export default PageHeader;
