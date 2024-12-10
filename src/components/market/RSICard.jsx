import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const RSICard = ({ crypto, rsi }) => {
  const getCryptoName = (id) => {
    const names = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'binancecoin': 'BNB',
      'solana': 'Solana',
      'ripple': 'XRP',
      'cardano': 'Cardano',
      'avalanche-2': 'Avalanche',
      'polkadot': 'Polkadot',
      'chainlink': 'Chainlink',
      'polygon': 'Polygon'
    };
    return names[id] || id;
  };

  return (
    <div className="flex justify-between items-center">
      <span>{getCryptoName(crypto)}</span>
      <Badge variant="secondary">
        RSI: {rsi?.toFixed(2) ?? 'Carregando...'}
      </Badge>
    </div>
  );
};