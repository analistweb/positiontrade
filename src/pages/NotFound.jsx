import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <span className="font-serif text-8xl lg:text-9xl font-bold text-foreground/10">
            404
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Página não encontrada
        </h1>

        {/* Description */}
        <p className="text-foreground-muted mb-8 leading-relaxed">
          Desculpe, a página que você está procurando não existe ou foi movida. 
          Verifique o endereço ou volte para a página inicial.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="default" size="lg">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Ir para Início
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <p className="text-sm text-foreground-subtle">
            Precisa de ajuda? Entre em contato conosco.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
