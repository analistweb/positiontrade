import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, TrendingUp, TrendingDown, MessageCircle, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const MarketSentiment = () => {
  // Dados simulados para demonstração
  const sentimentData = {
    overall: 65,
    social: 72,
    technical: 58,
    fundamental: 65,
    recentTweets: [
      { text: "Bitcoin está mostrando sinais de recuperação", sentiment: "positive" },
      { text: "Mercado ainda instável, mas com potencial", sentiment: "neutral" },
      { text: "Preocupação com regulamentações", sentiment: "negative" },
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            Análise de Sentimento
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Análise do sentimento geral do mercado baseada em dados sociais e técnicos
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sentimento Geral</span>
                <Badge variant={sentimentData.overall > 50 ? "success" : "destructive"}>
                  {sentimentData.overall}%
                </Badge>
              </div>
              <Progress value={sentimentData.overall} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Social</span>
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <Progress value={sentimentData.social} className="h-2 mb-2" />
                <span className="text-xs text-muted-foreground">
                  Baseado em menções em redes sociais
                </span>
              </div>

              <div className="p-4 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Técnico</span>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <Progress value={sentimentData.technical} className="h-2 mb-2" />
                <span className="text-xs text-muted-foreground">
                  Análise de indicadores técnicos
                </span>
              </div>

              <div className="p-4 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Fundamental</span>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <Progress value={sentimentData.fundamental} className="h-2 mb-2" />
                <span className="text-xs text-muted-foreground">
                  Análise de dados fundamentais
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-2">Últimas Menções</h3>
              {sentimentData.recentTweets.map((tweet, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-muted/50 flex items-center justify-between"
                >
                  <p className="text-sm">{tweet.text}</p>
                  <Badge 
                    variant={
                      tweet.sentiment === "positive" 
                        ? "success" 
                        : tweet.sentiment === "negative" 
                          ? "destructive" 
                          : "outline"
                    }
                  >
                    {tweet.sentiment === "positive" && <TrendingUp className="h-4 w-4 mr-1" />}
                    {tweet.sentiment === "negative" && <TrendingDown className="h-4 w-4 mr-1" />}
                    {tweet.sentiment}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MarketSentiment;