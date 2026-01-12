import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ErrorPage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-danger" />
          </div>
        </motion.div>

        {/* Error Code */}
        <span className="editorial-label text-danger mb-2 block">
          Erro 500
        </span>

        {/* Title */}
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Erro interno do servidor
        </h1>

        {/* Description */}
        <p className="text-foreground-muted mb-8 leading-relaxed">
          Algo inesperado aconteceu em nossos servidores. Nossa equipe já foi notificada 
          e está trabalhando para resolver o problema. Por favor, tente novamente em alguns minutos.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={handleRefresh} variant="default" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Ir para Início
            </Link>
          </Button>
        </div>

        {/* Status Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-foreground-subtle">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span>Sistema em manutenção</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
