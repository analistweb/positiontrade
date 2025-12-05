import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Status de Conexão e Health Check Global
 * Mostra WS online/offline, API status, última atualização
 */
const ConnectionStatus = ({ 
  wsConnected = false, 
  apiStatus = 'ok',
  lastUpdate = null,
  latencyMs = null
}) => {
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('pt-BR');
  };

  const getApiStatusColor = () => {
    if (apiStatus === 'ok') return 'text-buy';
    if (apiStatus === 'degraded') return 'text-warning';
    return 'text-sell';
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* WebSocket Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {wsConnected ? (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wifi className="w-4 h-4 text-buy" />
                </motion.div>
              ) : (
                <WifiOff className="w-4 h-4 text-sell" />
              )}
              <span className={wsConnected ? 'text-buy' : 'text-sell'}>
                WS {wsConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>WebSocket {wsConnected ? 'conectado' : 'desconectado'}</p>
            <p className="text-muted-foreground">Streaming de dados em tempo real</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <span className="text-border">|</span>

      {/* API Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Activity className={`w-4 h-4 ${getApiStatusColor()}`} />
              <span className={getApiStatusColor()}>
                API {apiStatus === 'ok' ? '✓' : apiStatus === 'degraded' ? '!' : '✗'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Status da API: {apiStatus}</p>
            {latencyMs && <p className="text-muted-foreground">Latência: {latencyMs}ms</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <span className="text-border">|</span>

      {/* Última Atualização */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatTime(lastUpdate)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Última atualização de dados</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Latência Badge */}
      {latencyMs !== null && (
        <Badge 
          variant="outline" 
          className={`text-[10px] ${latencyMs < 100 ? 'border-buy/30' : latencyMs < 500 ? 'border-warning/30' : 'border-sell/30'}`}
        >
          {latencyMs}ms
        </Badge>
      )}
    </div>
  );
};

export default ConnectionStatus;
