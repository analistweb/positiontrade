
import React, { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConnectionStatus, checkConnection, useConnectionStatus } from '../utils/connectionStatus';
import { toast } from 'sonner';

const StatusBar = () => {
  const { isOnline, lastAttemptTime } = useConnectionStatus();
  
  // Verifica a conexão periodicamente
  useEffect(() => {
    const checkTimer = setInterval(() => {
      checkConnection().then(online => {
        if (online && !getConnectionStatus().isOnline) {
          toast.success('Conexão restaurada', {
            description: 'Os dados em tempo real estão disponíveis novamente'
          });
        }
      });
    }, 30000); // Verifica a cada 30 segundos
    
    return () => clearInterval(checkTimer);
  }, []);
  
  // Formata o horário da última tentativa
  const formatLastAttempt = () => {
    return new Date(lastAttemptTime).toLocaleTimeString();
  };
  
  // Força verificação manual
  const handleManualCheck = () => {
    checkConnection().then(online => {
      if (online) {
        toast.success('Conectado com sucesso', {
          description: 'Os dados agora serão atualizados automaticamente'
        });
      } else {
        toast.error('Ainda sem conexão', {
          description: 'Continuaremos usando dados locais'
        });
      }
    });
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 rounded-full px-4 py-2 shadow-lg 
          ${isOnline ? 'bg-green-500/90' : 'bg-yellow-500/90'} text-white text-sm flex items-center gap-2`}
      >
        {isOnline ? (
          <Wifi size={16} className="text-white" />
        ) : (
          <WifiOff size={16} className="text-white" />
        )}
        <span>
          {isOnline 
            ? 'API conectada' 
            : 'Usando dados locais'}
          {' '}• Verificado: {formatLastAttempt()}
        </span>
        <button 
          onClick={handleManualCheck}
          className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          title="Verificar conexão agora"
        >
          <RefreshCw size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatusBar;
