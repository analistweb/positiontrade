import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';

/**
 * True Parallax Layer Component
 * Creates real multi-speed parallax effects with configurable depth
 */
export const ParallaxLayer = ({ 
  children, 
  speed = 0.5, // 0 = static, 1 = full scroll speed, negative = opposite direction
  className = '',
  direction = 'vertical', // 'vertical' | 'horizontal'
  offset = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Smooth spring physics for natural movement
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate parallax offset based on speed
  const range = 200 * speed;
  const y = useTransform(smoothProgress, [0, 1], [range + offset, -range + offset]);
  const x = useTransform(smoothProgress, [0, 1], [range + offset, -range + offset]);

  if (prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      style={{ 
        [direction === 'vertical' ? 'y' : 'x']: direction === 'vertical' ? y : x,
        willChange: 'transform'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Parallax Hero Section
 * Full-screen hero with multi-layer parallax effect
 */
export const ParallaxHero = ({
  backgroundImage,
  overlayColor = 'rgba(0,0,0,0.4)',
  children,
  className = '',
  height = '100vh',
  minHeight = '600px',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30
  });

  // Background moves slower than scroll (parallax effect)
  const backgroundY = useTransform(smoothProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.8, 0.3]);
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.1]);

  return (
    <div 
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ height, minHeight }}
    >
      {/* Background Layer - Slowest */}
      {backgroundImage && (
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            y: prefersReducedMotion ? 0 : backgroundY,
            scale: prefersReducedMotion ? 1 : scale,
            willChange: 'transform'
          }}
        />
      )}
      
      {/* Overlay */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: overlayColor,
          opacity: prefersReducedMotion ? 0.4 : opacity 
        }}
      />
      
      {/* Content Layer - Normal speed */}
      <div className="relative z-10 h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

/**
 * Scroll Progress Bar
 * Horizontal bar showing scroll progress at top of page
 */
export const ScrollProgressBar = ({ color = 'hsl(var(--primary))' }) => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
      style={{ 
        scaleX,
        backgroundColor: color,
        willChange: 'transform'
      }}
    />
  );
};

/**
 * Fade In On Scroll Component
 * Elements fade in as they enter the viewport
 */
export const FadeInOnScroll = ({ 
  children, 
  className = '',
  delay = 0,
  duration = 0.6,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  distance = 40,
  once = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: distance };
      case 'down': return { opacity: 0, y: -distance };
      case 'left': return { opacity: 0, x: distance };
      case 'right': return { opacity: 0, x: -distance };
      case 'none': return { opacity: 0 };
      default: return { opacity: 0, y: distance };
    }
  };

  const getFinalPosition = () => {
    switch (direction) {
      case 'up':
      case 'down': return { opacity: 1, y: 0 };
      case 'left':
      case 'right': return { opacity: 1, x: 0 };
      case 'none': return { opacity: 1 };
      default: return { opacity: 1, y: 0 };
    }
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={getFinalPosition()}
      viewport={{ once, margin: "-50px" }}
      transition={{ 
        duration, 
        delay,
        ease: [0.25, 0.1, 0.25, 1] // Custom easing for smooth feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger Container
 * Animates children in sequence
 */
export const StaggerContainer = ({
  children,
  className = '',
  staggerDelay = 0.1,
  initialDelay = 0,
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Parallax Background Decoration
 * Floating decorative elements with parallax
 */
export const ParallaxDecoration = ({
  className = '',
  speed = 0.3,
  children,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  
  const y = useTransform(scrollY, [0, 1000], [0, -200 * speed]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  if (prefersReducedMotion) {
    return <div className={`absolute pointer-events-none ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      style={{ y: smoothY, willChange: 'transform' }}
      className={`absolute pointer-events-none ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default ParallaxLayer;
