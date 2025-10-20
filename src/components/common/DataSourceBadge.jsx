import React from 'react';

/**
 * Badge component to indicate if data is from real API or simulated
 * @param {Object} props
 * @param {boolean} props.isRealData - Whether the data is from a real API
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 */
export const DataSourceBadge = ({ isRealData = true, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  if (isRealData) {
    return (
      <div className={`flex items-center gap-2 ${sizeClasses[size]} bg-green-500/20 rounded-full border border-green-500/40`}>
        <div className={`${dotSizes[size]} bg-green-500 rounded-full animate-pulse`}></div>
        <span className="text-green-400 font-medium">API Real</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]} bg-gray-500/20 rounded-full border border-gray-500/40`}>
      <div className={`${dotSizes[size]} bg-gray-400 rounded-full`}></div>
      <span className="text-gray-400 font-medium">Simulado</span>
    </div>
  );
};

/**
 * Legend component to show what data sources mean
 */
export const DataSourceLegend = () => {
  return (
    <div className="flex gap-4 items-center text-sm">
      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/40">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-400">Dados Reais da API</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 rounded-full border border-gray-500/40">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-gray-400">Dados Simulados</span>
      </div>
    </div>
  );
};
