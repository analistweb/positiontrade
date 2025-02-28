
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const RSIFallback = ({ onRetry }) => {
  const handleRetry = () => {
    toast.info("Tentando recarregar os dados...");
    if (onRetry) onRetry();
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Análise RSI Indisponível</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center p-4 text-center">
          <p className="mb-4 text-muted-foreground">
            Os dados para análise RSI não estão disponíveis no momento. Isso pode ocorrer devido a problemas de conexão 
            ou limitações da API.
          </p>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RSIFallback;
