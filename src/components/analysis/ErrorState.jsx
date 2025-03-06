
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { motion } from "framer-motion";

const ErrorState = ({ error, handleRefresh }) => {
  // Identificar o tipo de erro
  const isNetworkError = 
    error?.code === 'ERR_NETWORK' || 
    error?.message?.includes('Network Error') ||
    error?.message?.includes('timeout') ||
    error?.code === 'ECONNABORTED';
  
  const errorMessage = isNetworkError 
    ? "Falha na conexão com o servidor" 
    : error?.message || "Erro desconhecido";
  
  const errorDescription = isNetworkError
    ? "Verifique sua conexão com a internet ou tente novamente mais tarde."
    : "Ocorreu um problema ao processar sua solicitação.";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-destructive/10 mb-6">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20 text-destructive mb-2">
              {isNetworkError ? (
                <WifiOff className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-destructive">
              {errorMessage}
            </h3>
            
            <p className="text-muted-foreground">
              {errorDescription}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
              
              <Button 
                variant="default" 
                className="bg-primary"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ErrorState;
