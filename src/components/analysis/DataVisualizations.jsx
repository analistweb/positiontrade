
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import VolumeChart from '../market/VolumeChart';
import MarketStats from '../market/MarketStats';
import EMAAnalysis from '../market/EMAAnalysis';
import RSIRecommendation from '../market/RSIRecommendation';

const DataVisualizations = ({ marketData, minVolume, currentRSI, selectedCoin, handleRefresh }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div 
        className="lg:col-span-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div>Volume de Negociação</div>
              {marketData?.isFallbackData && (
                <span className="text-xs font-normal bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
                  Dados simulados
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VolumeChart 
              marketData={marketData} 
              minVolume={minVolume} 
            />
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <EMAAnalysis 
          marketData={marketData} 
          coin={selectedCoin} 
        />
        <RSIRecommendation />
        <MarketStats marketData={marketData} />
      </motion.div>
    </div>
  );
};

export default DataVisualizations;
