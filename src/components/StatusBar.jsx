
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConnectionStatus, checkConnection, useConnectionStatus } from '../utils/connectionStatus';
import { toast } from 'sonner';

const StatusBar = () => {
  const { isOnline, lastAttemptTime } = useConnectionStatus();
  const [isVisible, setIsVisible] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  
  // Verifica a conexão periodicamente e quando o usuário volta para a página
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
    
    // Verificar quando o usuário volta para a página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(checkTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Permite fechar a barra após 5 segundos quando estiver online
  useEffect(() => {
    if (isOnline) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(hideTimer);
    } else {
      setIsVisible(true);
    }
  }, [isOnline]);
  
  // Formata o horário da última tentativa
  const formatLastAttempt = () => {
    return new Date(lastAttemptTime).toLocaleTimeString();
  };
  
  // Força verificação manual
  const handleManualCheck = () => {
    setReconnecting(true);
    checkConnection().then(online => {
      setReconnecting(false);
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
  
  if (!isVisible && isOnline) return null;
  
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
          <Server size={16} className="text-white" />
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
          disabled={reconnecting}
          className={`ml-2 p-1 rounded-full hover:bg-white/20 transition-colors ${reconnecting ? 'opacity-50' : ''}`}
          title="Verificar conexão agora"
        >
          <RefreshCw size={14} className={reconnecting ? 'animate-spin' : ''} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatusBar;
