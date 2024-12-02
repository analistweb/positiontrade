import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

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
        <div className="space-y-4">
          <motion.div 
            className="p-4 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Taxa de Hash</span>
              <Badge variant={fundamentalData.hashrate.trend === 'up' ? 'success' : 'destructive'}>
                {fundamentalData.hashrate.trend === 'up' ? '↑' : '↓'} {fundamentalData.hashrate.current} EH/s
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Variação: {((fundamentalData.hashrate.current - fundamentalData.hashrate.previous) / fundamentalData.hashrate.previous * 100).toFixed(2)}%
            </p>
          </motion.div>

          <motion.div 
            className="p-4 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Transações Diárias</span>
              <Badge variant={fundamentalData.transactions.trend === 'up' ? 'success' : 'destructive'}>
                {fundamentalData.transactions.trend === 'up' ? '↑' : '↓'} {fundamentalData.transactions.current.toLocaleString()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Variação: {((fundamentalData.transactions.current - fundamentalData.transactions.previous) / fundamentalData.transactions.previous * 100).toFixed(2)}%
            </p>
          </motion.div>

          <div className="text-sm text-muted-foreground text-right mt-4">
            Última atualização: {new Date(fundamentalData.lastUpdate).toLocaleString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnaliseIndicadores;