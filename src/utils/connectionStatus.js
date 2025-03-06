
// Armazena o estado global da conexão com a API
let isOnline = true;
let lastAttemptTime = Date.now();
let connectionListeners = [];
let retryTimeout = null;

// Atualiza o estado da conexão e notifica os ouvintes
export const updateConnectionStatus = (status) => {
  const oldStatus = isOnline;
  isOnline = status;
  lastAttemptTime = Date.now();
  
  if (oldStatus !== isOnline) {
    notifyListeners();
    console.log(`Status de conexão atualizado: ${isOnline ? 'Online' : 'Offline'}`);
  }
};

// Adiciona um ouvinte para mudanças no estado da conexão
export const addConnectionListener = (listener) => {
  connectionListeners.push(listener);
  return () => {
    connectionListeners = connectionListeners.filter(l => l !== listener);
  };
};

// Notifica todos os ouvintes sobre a mudança no estado
const notifyListeners = () => {
  connectionListeners.forEach(listener => {
    listener(isOnline, lastAttemptTime);
  });
};

// Obtém o estado atual da conexão
export const getConnectionStatus = () => ({
  isOnline,
  lastAttemptTime
});

// Hook React.js para componentes que precisam do estado da conexão
export const useConnectionStatus = () => {
  const [status, setStatus] = React.useState(getConnectionStatus());
  
  React.useEffect(() => {
    const cleanup = addConnectionListener((isOnline, lastAttemptTime) => {
      setStatus({
        isOnline,
        lastAttemptTime
      });
    });
    
    return cleanup;
  }, []);
  
  return status;
};

// Tenta verificar a conectividade com endpoints diferentes
export const checkConnection = async () => {
  try {
    // Limpa qualquer timeout pendente
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Tentativa com CoinGecko primeiro
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/ping', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (response.ok) {
        updateConnectionStatus(true);
        return true;
      }
    } catch (error) {
      console.warn('Falha na verificação principal de conexão, tentando endpoint alternativo');
    }
    
    // Tentativa com endpoint alternativo
    try {
      const alternativeResponse = await fetch('https://blockchain.info/ticker', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      updateConnectionStatus(alternativeResponse.ok);
      return alternativeResponse.ok;
    } catch (error) {
      console.error('Todas as tentativas de verificação de conexão falharam');
      updateConnectionStatus(false);
      
      // Agendar nova tentativa automática em caso de falha
      retryTimeout = setTimeout(() => {
        checkConnection();
      }, 30000); // 30 segundos
      
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    updateConnectionStatus(false);
    return false;
  }
};

// Inicia verificação periódica de conexão
let connectionCheckInterval = null;

export const startConnectionMonitoring = (intervalMs = 30000) => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  connectionCheckInterval = setInterval(() => {
    checkConnection();
  }, intervalMs);
  
  // Verifica imediatamente
  checkConnection();
  
  // Adiciona eventos de navegador para detectar mudanças na conectividade
  window.addEventListener('online', () => checkConnection());
  window.addEventListener('offline', () => updateConnectionStatus(false));
  
  return () => {
    clearInterval(connectionCheckInterval);
    if (retryTimeout) clearTimeout(retryTimeout);
    window.removeEventListener('online', checkConnection);
    window.removeEventListener('offline', () => updateConnectionStatus(false));
  };
};
