
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ArrowRightLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionList from './whale-transactions/TransactionList';
import TransactionInsights from './whale-transactions/TransactionInsights';

const WhaleTransactions = ({ transactions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-blue-50/5 to-purple-50/5">
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <ArrowRightLeft className="h-6 w-6" />
            Movimentações de Grandes Carteiras
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Análise de movimentações significativas baseada em dados de grandes players do mercado
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <TransactionList transactions={transactions} />
            </TabsContent>

            <TabsContent value="insights">
              <TransactionInsights transactions={transactions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WhaleTransactions;
