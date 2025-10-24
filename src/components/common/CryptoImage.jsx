import React, { useState } from 'react';

const CryptoImage = ({ src, alt, symbol, className = "w-6 h-6" }) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  if (error || !src) {
    // Fallback para um placeholder com a primeira letra do símbolo
    const firstLetter = symbol?.charAt(0)?.toUpperCase() || '?';
    return (
      <div 
        className={`${className} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs`}
        title={alt}
      >
        {firstLetter}
      </div>
    );
  }

  return (
    <img 
      src={src}
      alt={alt}
      className={`${className} rounded-full`}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default CryptoImage;
