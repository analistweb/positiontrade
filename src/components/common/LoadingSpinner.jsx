import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Reusable loading spinner component with consistent styling
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 * @param {boolean} props.fullPage - Whether to show full page loading
 */
export const LoadingSpinner = ({ 
  message = 'Carregando...', 
  size = 'md',
  fullPage = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = fullPage 
    ? 'min-h-screen flex items-center justify-center'
    : 'min-h-[400px] flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className={`${sizeClasses[size]} text-primary`} />
        </motion.div>
        {message && (
          <span className="text-muted-foreground">{message}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Loading card component for inline loading states
 */
export const LoadingCard = ({ title = 'Carregando dados...' }) => {
  return (
    <Card>
      <CardContent className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
          <span className="text-muted-foreground">{title}</span>
        </div>
      </CardContent>
    </Card>
  );
};
