import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Radio, TrendingUp, Globe, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CryptoBubbles from './CryptoBubbles';
import FearGreedIndex from './FearGreedIndex';

const LiveCryptoHero = ({ 
  coins = [], 
  globalData = null, 
  formatCurrency = (v) => `$${v}` 
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(220,18%,8%)] to-[hsl(220,18%,5%)]">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating Orbs with Parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-[10%] w-96 h-96 rounded-full bg-accent1/10 blur-[120px]"
          animate={prefersReducedMotion ? {} : {
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-40 right-[15%] w-80 h-80 rounded-full bg-accent2/15 blur-[100px]"
          animate={prefersReducedMotion ? {} : {
            y: [0, 25, 0],
            scale: [1, 0.95, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]"
          animate={prefersReducedMotion ? {} : {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 editorial-container py-16 md:py-24">
        {/* AO VIVO Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <Badge className="px-5 py-2.5 text-sm font-semibold bg-red-500/20 text-red-400 border-red-500/30 backdrop-blur-sm">
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-red-500 mr-3"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            AO VIVO
          </Badge>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center mb-6"
        >
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4">
            Principais Criptomoedas
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Dados em tempo real do mercado global de criptomoedas
          </p>
        </motion.div>

        {/* Crypto Bubbles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-12"
        >
          <CryptoBubbles coins={coins} />
        </motion.div>

        {/* Market Stats - Glass Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {/* Market Cap */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent1/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-accent1" />
                <span className="text-xs text-white/50 uppercase tracking-wider">Market Cap</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {formatCurrency(globalData?.total_market_cap?.usd)}
              </p>
            </div>
          </div>

          {/* BTC Dominance */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/50 uppercase tracking-wider">BTC Dom.</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {globalData?.market_cap_percentage?.btc?.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Active Cryptos */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent2/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-accent2" />
                <span className="text-xs text-white/50 uppercase tracking-wider">Ativos</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {globalData?.active_cryptocurrencies?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Fear & Greed Inline */}
          <FearGreedIndex variant="compact" />
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default LiveCryptoHero;
