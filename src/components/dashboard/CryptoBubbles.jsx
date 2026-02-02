import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CryptoImage from '@/components/common/CryptoImage';

const CryptoBubbles = ({ coins = [] }) => {
  // Calculate bubble sizes based on market cap
  const bubbleData = useMemo(() => {
    if (!coins.length) return [];
    
    const maxMarketCap = Math.max(...coins.map(c => c.market_cap));
    const minMarketCap = Math.min(...coins.map(c => c.market_cap));
    
    return coins.map((coin, index) => {
      // Normalize size between 120px and 200px
      const normalizedCap = (coin.market_cap - minMarketCap) / (maxMarketCap - minMarketCap || 1);
      const size = 120 + normalizedCap * 80;
      
      // Calculate color intensity based on price change
      const priceChange = coin.price_change_percentage_24h || 0;
      const isPositive = priceChange >= 0;
      const intensity = Math.min(Math.abs(priceChange) / 10, 1); // Cap at 10%
      
      // Generate random float animation parameters
      const floatDuration = 4 + Math.random() * 3;
      const floatDelay = index * 0.2;
      const floatX = (Math.random() - 0.5) * 20;
      const floatY = (Math.random() - 0.5) * 15;
      
      return {
        ...coin,
        size,
        isPositive,
        intensity,
        floatDuration,
        floatDelay,
        floatX,
        floatY,
      };
    });
  }, [coins]);

  if (!coins.length) {
    return (
      <div className="flex items-center justify-center h-80 text-foreground-muted">
        Carregando bolhas...
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[450px] md:min-h-[550px] overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm border border-white/10 p-6 md:p-10">
      {/* Enhanced Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent2/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent1/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      
      {/* Bubbles container */}
      <div className="relative flex flex-wrap items-center justify-center gap-5 md:gap-8">
        {bubbleData.map((bubble, index) => (
          <BubbleItem key={bubble.id} bubble={bubble} index={index} />
        ))}
      </div>
    </div>
  );
};

const BubbleItem = ({ bubble, index }) => {
  const {
    id,
    symbol,
    name,
    image,
    current_price,
    price_change_percentage_24h,
    size,
    isPositive,
    intensity,
    floatDuration,
    floatDelay,
    floatX,
    floatY,
  } = bubble;

  const priceChange = price_change_percentage_24h || 0;
  
  // Dynamic colors based on price change
  const bgColor = isPositive 
    ? `rgba(34, 197, 94, ${0.15 + intensity * 0.25})` 
    : `rgba(239, 68, 68, ${0.15 + intensity * 0.25})`;
  
  const borderColor = isPositive 
    ? `rgba(34, 197, 94, ${0.4 + intensity * 0.4})` 
    : `rgba(239, 68, 68, ${0.4 + intensity * 0.4})`;
  
  const glowColor = isPositive 
    ? `0 0 ${20 + intensity * 30}px rgba(34, 197, 94, ${0.3 + intensity * 0.3})` 
    : `0 0 ${20 + intensity * 30}px rgba(239, 68, 68, ${0.3 + intensity * 0.3})`;

  const formatPrice = (price) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: [0, floatX, -floatX * 0.5, floatX * 0.3, 0],
        y: [0, floatY, -floatY * 0.5, floatY * 0.7, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay: index * 0.1 },
        scale: { duration: 0.5, delay: index * 0.1, type: 'spring', stiffness: 200 },
        x: { duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
        y: { duration: floatDuration * 1.2, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
      }}
      whileHover={{ 
        scale: 1.15, 
        zIndex: 50,
        transition: { duration: 0.2 }
      }}
      className="relative cursor-pointer group"
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Bubble */}
      <motion.div
        className="absolute inset-0 rounded-full flex flex-col items-center justify-center p-3 backdrop-blur-sm transition-all duration-300"
        style={{
          background: bgColor,
          border: `2px solid ${borderColor}`,
          boxShadow: glowColor,
        }}
        animate={{
          boxShadow: [
            glowColor,
            glowColor.replace(/[\d.]+\)$/, `${0.4 + intensity * 0.4})`),
            glowColor,
          ],
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {/* Crypto Logo */}
        <CryptoImage 
          src={image} 
          alt={name}
          symbol={symbol}
          className="w-8 h-8 md:w-10 md:h-10 mb-1"
        />
        
        {/* Symbol */}
        <span className="font-bold text-sm md:text-base text-foreground">
          {symbol.toUpperCase()}
        </span>
        
        {/* Price Change */}
        <span 
          className={`font-semibold text-xs md:text-sm ${isPositive ? 'text-success' : 'text-danger'}`}
        >
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
        </span>
        
        {/* Price - shown on hover */}
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          className="text-xs text-foreground-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {formatPrice(current_price)}
        </motion.span>
      </motion.div>
      
      {/* Hover ring effect */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          border: `3px solid ${borderColor}`,
          boxShadow: `0 0 30px ${isPositive ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
        }}
      />
    </motion.div>
  );
};

export default CryptoBubbles;
