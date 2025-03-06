
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

const ErrorState = ({ error, handleRefresh }) => {
  return (
    <Card className="bg-destructive/10 mb-6">
      <CardContent className="p-6">
        <div className="text-center">
          <p className="text-destructive mb-4 flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro ao carregar dados: {error.message}
          </p>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorState;
