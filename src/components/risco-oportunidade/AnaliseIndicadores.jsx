import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { InfoIcon } from "lucide-react";

const AnaliseIndicadores = ({ fundamentalData }) => {
  if (!fundamentalData) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-xl">
          Indicadores Fundamentalistas
          <Badge variant={fundamentalData.hashrate.trend === 'up' ? 'success' : 'destructive'}>
            {fundamentalData.hashrate.trend === 'up' ? 'COMPRAR' : 'VENDER'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <motion.div 
            className="p-4 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Taxa de Hash</span>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">O que é Taxa de Hash?</h4>
                      <p className="text-sm text-muted-foreground">
                        A Taxa de Hash (Hash Rate) é a medida do poder computacional total da rede Bitcoin. 
                        Quanto maior a taxa, mais segura é a rede.
                      </p>
                      <div className="mt-2">
                        <h5 className="font-semibold text-sm">Como interpretar:</h5>
                        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                          <li>Taxa crescente (↑): Indica maior segurança e confiança na rede. Geralmente um sinal de COMPRA.</li>
                          <li>Taxa decrescente (↓): Pode indicar mineradores saindo da rede. Sinal de cautela.</li>
                        </ul>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        EH/s = ExaHash por segundo (quintilhões de cálculos por segundo)
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Badge variant={fundamentalData.hashrate.trend === 'up' ? 'success' : 'destructive'}>
                {fundamentalData.hashrate.trend === 'up' ? '↑' : '↓'} {fundamentalData.hashrate.current} EH/s
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Variação: {((fundamentalData.hashrate.current - fundamentalData.hashrate.previous) / fundamentalData.hashrate.previous * 100).toFixed(2)}%
              </p>
              <p className="text-sm">
                <span className={`font-medium ${fundamentalData.hashrate.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  Sentimento: {fundamentalData.hashrate.trend === 'up' ? 'Positivo - Rede mais segura e robusta' : 'Cautela - Possível instabilidade na rede'}
                </span>
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="p-4 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Transações Diárias</span>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">O que são Transações Diárias?</h4>
                      <p className="text-sm text-muted-foreground">
                        Número total de transações processadas na rede Bitcoin em 24 horas. 
                        Indica o nível de atividade e adoção da rede.
                      </p>
                      <div className="mt-2">
                        <h5 className="font-semibold text-sm">Como interpretar:</h5>
                        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                          <li>Volume crescente (↑): Maior adoção e uso da rede. Geralmente positivo para o preço.</li>
                          <li>Volume decrescente (↓): Menor atividade na rede. Pode indicar menor interesse.</li>
                        </ul>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Badge variant={fundamentalData.transactions.trend === 'up' ? 'success' : 'destructive'}>
                {fundamentalData.transactions.trend === 'up' ? '↑' : '↓'} {fundamentalData.transactions.current.toLocaleString()}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Variação: {((fundamentalData.transactions.current - fundamentalData.transactions.previous) / fundamentalData.transactions.previous * 100).toFixed(2)}%
              </p>
              <p className="text-sm">
                <span className={`font-medium ${fundamentalData.transactions.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  Sentimento: {fundamentalData.transactions.trend === 'up' ? 'Positivo - Aumento na adoção' : 'Cautela - Redução na atividade'}
                </span>
              </p>
            </div>
          </motion.div>

          <div className="text-sm text-muted-foreground text-right mt-4 flex items-center justify-end gap-2">
            <span>Última atualização: {new Date(fundamentalData.lastUpdate).toLocaleString('pt-BR')}</span>
            <HoverCard>
              <HoverCardTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-4">
                <p className="text-sm text-muted-foreground">
                  Os dados são atualizados automaticamente a cada 5 minutos para fornecer uma visão precisa e atual do mercado.
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnaliseIndicadores;