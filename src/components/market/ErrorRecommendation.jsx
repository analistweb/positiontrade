import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";

const ErrorRecommendation = () => (
  <Card className="border-destructive/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-destructive">
        <AlertTriangleIcon className="h-5 w-5" />
        Erro ao Carregar Dados
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar as recomendações. Por favor, tente novamente mais tarde.
      </p>
    </CardContent>
  </Card>
);

export default ErrorRecommendation;