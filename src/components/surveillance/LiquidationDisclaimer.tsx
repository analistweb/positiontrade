import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

const LiquidationDisclaimer: React.FC = React.memo(() => {
  return (
    <Card className="bg-muted/20 border-border/30">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              <strong>Sobre este mapa:</strong> Combina liquidações forçadas já
              ocorridas com zonas projetadas baseadas em padrões recentes. Zonas
              projetadas indicam possíveis áreas de vulnerabilidade condicional,
              não previsões de preço.
            </p>
            <p>
              <strong>Limitações:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Apenas dados da Binance Futures</li>
              <li>Liquidações futuras reais são desconhecidas</li>
              <li>Posições abertas e alavancagens não são públicas</li>
              <li>Projeções falham se o regime de mercado mudar</li>
            </ul>
            <p className="italic pt-1">
              O sistema não prevê preço futuro, não identifica posições
              individuais e não afirma intenção do mercado. Qualquer uso além da
              contextualização de risco é interpretação do usuário.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

LiquidationDisclaimer.displayName = 'LiquidationDisclaimer';

export default LiquidationDisclaimer;
