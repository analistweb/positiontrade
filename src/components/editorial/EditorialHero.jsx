import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Editorial Hero with True Parallax
 * Multi-layer parallax effect with smooth scroll-linked animations
 */
export const EditorialHero = ({ 
  label, 
  title, 
  description, 
  children,
  align = 'center',
  size = 'default',
  showParallax = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Smooth spring physics for natural movement
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Parallax transforms for different layers
  const backgroundY = useTransform(smoothProgress, [0, 1], [0, 150]);
  const contentY = useTransform(smoothProgress, [0, 1], [0, 50]);
  const opacity = useTransform(smoothProgress, [0, 0.5], [1, 0.6]);
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.1]);
  const decorY = useTransform(smoothProgress, [0, 1], [0, -100]);
  const decorRotate = useTransform(smoothProgress, [0, 1], [0, 15]);

  const alignClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  const sizeClasses = {
    small: 'max-w-xl py-16 lg:py-20',
    default: 'max-w-3xl py-20 lg:py-28',
    large: 'max-w-4xl py-24 lg:py-36',
  };

  const useParallax = showParallax && !prefersReducedMotion;

  return (
    <div ref={ref} className="relative overflow-hidden">
      {/* Background Layer - Slowest parallax */}
      <motion.div
        className="absolute inset-0"
        style={{
          y: useParallax ? backgroundY : 0,
          scale: useParallax ? scale : 1,
          willChange: 'transform'
        }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background-alt" />
        
        {/* Dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Decorative elements with parallax */}
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)',
            y: useParallax ? decorY : 0,
            rotate: useParallax ? decorRotate : 0,
            willChange: 'transform'
          }}
        />
        
        <motion.div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.05) 0%, transparent 60%)',
            y: useParallax ? decorY : 0,
            willChange: 'transform'
          }}
        />
      </motion.div>

      {/* Content Layer - Medium parallax */}
      <motion.div
        className={`relative z-10 ${sizeClasses[size]}`}
        style={{
          y: useParallax ? contentY : 0,
          opacity: useParallax ? opacity : 1,
          willChange: 'transform, opacity'
        }}
      >
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
      </motion.div>
    </div>
  );
};

/**
 * Editorial Section with Fade-In Animation
 */
export const EditorialSection = ({ 
  label, 
  title, 
  description, 
  children,
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className={`editorial-section ${className}`}>
      <div className="editorial-container">
        {/* Section Header */}
        {(label || title || description) && (
          <div className="max-w-2xl mb-12">
            {label && (
              <motion.span
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="editorial-label block mb-3"
              >
                {label}
              </motion.span>
            )}
            {title && (
              <motion.h2
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
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
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
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
