import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExecutiveSummaryProps {
  summary: string;
  ticker: string;
  analyzedAt: string;
}

export function ExecutiveSummary({ summary, ticker, analyzedAt }: ExecutiveSummaryProps) {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <FileText className="h-4 w-4" />
              Resumo Executivo — {ticker}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(analyzedAt)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            {summary}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
