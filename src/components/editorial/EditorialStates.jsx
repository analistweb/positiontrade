import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, FileQuestion, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Loading State
export const EditorialLoading = ({ 
  title = 'Carregando...', 
  description = 'Aguarde enquanto buscamos os dados mais recentes.' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 lg:py-24"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-border" />
        <Loader2 className="absolute inset-0 w-16 h-16 text-primary animate-spin" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground-subtle max-w-sm text-center">{description}</p>
    </motion.div>
  );
};

// Loading Skeleton
export const EditorialSkeleton = ({ lines = 3, showImage = false }) => {
  return (
    <div className="animate-pulse">
      {showImage && (
        <div className="w-full h-48 bg-background-alt rounded-lg mb-4" />
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-background-alt rounded ${
              i === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Empty State
export const EditorialEmpty = ({ 
  title = 'Nenhum dado encontrado', 
  description = 'Não encontramos informações para exibir no momento.',
  icon: Icon = FileQuestion,
  action,
  actionLabel = 'Tentar novamente'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 lg:py-24 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-background-alt flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-foreground-subtle" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground-subtle max-w-sm">{description}</p>
      {action && (
        <Button onClick={action} variant="outline" className="mt-6">
          <RefreshCw className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

// Error State
export const EditorialError = ({ 
  title = 'Algo deu errado', 
  description = 'Não foi possível carregar os dados. Por favor, tente novamente.',
  onRetry
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 lg:py-24 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-danger" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground-subtle max-w-sm">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </motion.div>
  );
};

// Card Loading Skeleton
export const EditorialCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-6 animate-pulse">
          <div className="w-12 h-12 bg-background-alt rounded-lg mb-4" />
          <div className="h-5 bg-background-alt rounded w-2/3 mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-background-alt rounded w-full" />
            <div className="h-3 bg-background-alt rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditorialLoading;
