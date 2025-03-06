
// Armazena o estado global da conexão com a API
let isOnline = true;
let lastAttemptTime = Date.now();
let connectionListeners = [];

// Atualiza o estado da conexão e notifica os ouvintes
export const updateConnectionStatus = (status) => {
  const oldStatus = isOnline;
  isOnline = status;
  lastAttemptTime = Date.now();
  
  if (oldStatus !== isOnline) {
    notifyListeners();
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
    listener(isOnline);
  });
};

// Obtém o estado atual da conexão
export const getConnectionStatus = () => ({
  isOnline,
  lastAttemptTime
});

// Hook para componentes React que precisam do estado da conexão
export const useConnectionStatus = () => {
  const [status, setStatus] = React.useState(getConnectionStatus());
  
  React.useEffect(() => {
    const cleanup = addConnectionListener((isOnline) => {
      setStatus({
        isOnline,
        lastAttemptTime
      });
    });
    
    return cleanup;
  }, []);
  
  return status;
};

// Tenta verificar a conectividade fazendo uma solicitação simples
export const checkConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    updateConnectionStatus(response.ok);
    return response.ok;
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
    window.removeEventListener('online', checkConnection);
    window.removeEventListener('offline', () => updateConnectionStatus(false));
  };
};
