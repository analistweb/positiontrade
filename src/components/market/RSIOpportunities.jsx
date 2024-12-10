import { Badge } from "@/components/ui/badge";

export const RSIOpportunities = ({ oversoldCryptos }) => {
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
    <div className="bg-green-100 p-4 rounded-lg">
      <p className="text-green-800 font-medium">
        ✨ Oportunidades de DCA Encontradas!
      </p>
      <div className="mt-3 space-y-2">
        {oversoldCryptos.map(([crypto, rsi]) => (
          <div key={crypto} className="flex justify-between items-center">
            <span className="text-green-700">{getCryptoName(crypto)}</span>
            <Badge variant="secondary">
              RSI: {rsi?.toFixed(2) ?? 'N/A'}
            </Badge>
          </div>
        ))}
      </div>
      <p className="text-sm text-green-600 mt-3">
        Estas criptomoedas apresentam RSI em níveis de sobre-venda, 
        sugerindo possíveis pontos de entrada para sua estratégia DCA.
      </p>
    </div>
  );
};