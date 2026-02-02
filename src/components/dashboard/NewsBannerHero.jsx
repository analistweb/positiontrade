import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Newspaper, Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NewsBannerHero = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-accent1/20 via-background to-accent2/20"
          animate={prefersReducedMotion ? {} : {
            background: [
              'linear-gradient(135deg, hsl(15 62% 59% / 0.15) 0%, hsl(var(--background)) 50%, hsl(165 40% 39% / 0.15) 100%)',
              'linear-gradient(135deg, hsl(165 40% 39% / 0.15) 0%, hsl(var(--background)) 50%, hsl(15 62% 59% / 0.15) 100%)',
              'linear-gradient(135deg, hsl(15 62% 59% / 0.15) 0%, hsl(var(--background)) 50%, hsl(165 40% 39% / 0.15) 100%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Diagonal Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            currentColor 40px,
            currentColor 41px
          )`,
        }}
      />

      {/* Floating Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={prefersReducedMotion ? {} : {
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          >
            <Sparkles className="w-4 h-4 text-accent1/40" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 editorial-container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon with Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative inline-block mb-6"
          >
            <div className="absolute inset-0 bg-accent1/30 rounded-full blur-2xl scale-150" />
            <div className="relative bg-gradient-to-br from-accent1 to-accent1/80 p-5 rounded-2xl shadow-lg shadow-accent1/25">
              <Newspaper className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <Badge className="px-4 py-2 text-sm font-semibold bg-accent2/20 text-accent2 border-accent2/30 backdrop-blur-sm">
              <motion.span
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="w-3.5 h-3.5 mr-2 inline" />
              </motion.span>
              TEMPO REAL
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4"
          >
            Últimas Atualizações
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto"
          >
            Notícias que movem o mercado cripto
          </motion.p>

          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-24 h-1 bg-gradient-to-r from-accent1 to-accent2 mx-auto mt-8 rounded-full"
          />
        </div>
      </div>
    </section>
  );
};

export default NewsBannerHero;
