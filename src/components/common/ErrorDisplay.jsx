import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Reusable error display component with consistent styling
 * @param {Object} props
 * @param {string} props.title - Error title
 * @param {string} props.message - Error message
 * @param {Function} props.onRetry - Optional retry function
 * @param {boolean} props.showIcon - Whether to show error icon
 */
export const ErrorDisplay = ({ 
  title = 'Erro ao carregar dados',
  message = 'Não foi possível carregar os dados no momento.',
  onRetry,
  showIcon = true 
}) => {
  return (
    <Card className="border-destructive/50">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {showIcon && (
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">
              {title}
            </h3>
            <p className="text-muted-foreground">
              {message}
            </p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Inline error alert component
 */
export const ErrorAlert = ({ 
  title = 'Erro',
  message,
  onRetry 
}) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
