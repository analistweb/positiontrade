import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const getCryptoName = (id) => {
  const names = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'babydoge': 'Baby Doge Coin',
    'cardano': 'Cardano',
    'polkadot': 'Polkadot'
  };
  return names[id] || id;
};

export const CryptoList = ({ cryptos, rsiData }) => (
  <div className="mt-4 space-y-3">
    {cryptos.map(crypto => (
      <motion.div
        key={crypto}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center p-3 bg-white/80 dark:bg-black/20 rounded-lg hover:bg-white/90 dark:hover:bg-black/30 transition-colors"
      >
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {getCryptoName(crypto)}
        </span>
        <Badge variant="secondary" className="font-mono">
          RSI: {rsiData?.[crypto]?.toFixed(2) || 'N/A'}
        </Badge>
      </motion.div>
    ))}
  </div>
);