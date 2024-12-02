import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import SearchTrendsChart from '../dashboard/SearchTrendsChart';

const AnaliseSentimento = ({ newsData }) => {
  if (!newsData) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-xl">
          Análise de Sentimento do Mercado
          <Badge variant={newsData?.sentimentScore > 50 ? "success" : "destructive"}>
            {newsData?.sentimentScore}% Positivo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Tendências de Busca</h3>
          <SearchTrendsChart />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Últimas Notícias:</h3>
          {newsData?.headlines.map((headline, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-4 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
            >
              <p className="text-sm mb-2">{headline.title}</p>
              <Badge 
                variant={headline.sentiment === 'positive' ? 'success' : 'destructive'} 
                className="mt-2"
              >
                {headline.sentiment === 'positive' ? 'Otimista' : 'Pessimista'}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnaliseSentimento;