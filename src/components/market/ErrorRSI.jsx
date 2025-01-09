import React from 'react';
import { AlertTriangleIcon } from "lucide-react";
import { RSICard } from './RSICard';

export const ErrorRSI = () => (
  <RSICard>
    <div className="bg-destructive/10 p-6 rounded-lg">
      <p className="text-destructive flex items-center gap-2">
        <AlertTriangleIcon className="h-5 w-5" />
        Erro ao carregar dados. Tentando novamente em alguns segundos...
      </p>
    </div>
  </RSICard>
);