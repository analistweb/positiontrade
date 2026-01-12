import React from 'react';
import { motion } from 'framer-motion';

export const EditorialHero = ({ 
  label, 
  title, 
  description, 
  children,
  align = 'center',
  size = 'default'
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  const sizeClasses = {
    small: 'max-w-xl py-12 lg:py-16',
    default: 'max-w-3xl py-16 lg:py-24',
    large: 'max-w-4xl py-20 lg:py-32',
  };

  return (
    <div className={`editorial-hero ${sizeClasses[size]}`}>
      <div className={`editorial-container ${alignClasses[align]}`}>
        {/* Label */}
        {label && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="editorial-label inline-block mb-4"
          >
            {label}
          </motion.span>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-hero text-foreground"
        >
          {title}
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg lg:text-xl text-foreground-muted leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {/* Actions/Children */}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export const EditorialSection = ({ 
  label, 
  title, 
  description, 
  children,
  className = '' 
}) => {
  return (
    <section className={`editorial-section ${className}`}>
      <div className="editorial-container">
        {/* Section Header */}
        {(label || title || description) && (
          <div className="max-w-2xl mb-12">
            {label && (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="editorial-label block mb-3"
              >
                {label}
              </motion.span>
            )}
            {title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="font-editorial text-foreground"
              >
                {title}
              </motion.h2>
            )}
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-4 text-foreground-muted"
              >
                {description}
              </motion.p>
            )}
          </div>
        )}

        {/* Section Content */}
        {children}
      </div>
    </section>
  );
};

export default EditorialHero;
