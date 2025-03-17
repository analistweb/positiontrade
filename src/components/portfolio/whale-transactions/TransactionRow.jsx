
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Wallet, Building, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

const TransactionRow = React.memo(({ transaction: tx, index, dataSource = 'exchange', style }) => {
  const handleExternalClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const smartMoneyColor = 
    tx.smartMoneyScore >= 85 ? 'text-green-500' :
    tx.smartMoneyScore >= 70 ? 'text-yellow-500' :
    'text-red-500';

  if (dataSource === 'onchain') {
    return (
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className="hover:bg-muted/30 transition-colors"
        style={style}
      >
        <TableCell className="text-sm text-muted-foreground">
          {formatDate(tx.timestamp)}
        </TableCell>
        <TableCell>
          <Badge 
            variant={tx.type === "Compra" ? "success" : "destructive"}
            className="flex items-center gap-1"
          >
            {tx.type === "Compra" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {tx.type}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">
              {tx.cryptoAmount} {tx.cryptoSymbol}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(tx.volume)}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors" onClick={() => handleExternalClick(tx.blockExplorer)}>
                  <span className="max-w-[120px] truncate">{tx.fromName || "Carteira Desconhecida"}</span>
                  {tx.blockExplorer && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">
                    {tx.fromAddress}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors" onClick={() => handleExternalClick(tx.blockExplorer)}>
                  <span className="max-w-[120px] truncate">{tx.destinationName || "Carteira Desconhecida"}</span>
                  {tx.blockExplorer && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">
                    {tx.destinationAddress}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
        <TableCell>
          <Badge 
            variant="outline" 
            className={`bg-primary/10 ${smartMoneyColor}`}
          >
            {tx.smartMoneyScore}/100
          </Badge>
        </TableCell>
      </motion.tr>
    );
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="hover:bg-muted/30 transition-colors"
      style={style}
    >
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(tx.timestamp)}
      </TableCell>
      <TableCell>
        <Badge 
          variant={tx.type === "Compra" ? "success" : "destructive"}
          className="flex items-center gap-1"
        >
          {tx.type === "Compra" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {tx.type}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">
            {tx.cryptoAmount} {tx.cryptoSymbol}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(tx.volume)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {tx.exchange ? (
            <>
              <Building className="h-4 w-4 text-primary" />
              <span>{tx.exchange}</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 text-primary" />
              <span>Carteira Privada</span>
            </>
          )}
          {tx.destinationAddress && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ExternalLink 
                    className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => handleExternalClick(tx.blockExplorer || `https://etherscan.io/address/${tx.destinationAddress}`)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">
                    {tx.destinationAddress}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge 
          variant="outline" 
          className={`bg-primary/10 ${smartMoneyColor}`}
        >
          {tx.smartMoneyScore}/100
        </Badge>
      </TableCell>
    </motion.tr>
  );
});

TransactionRow.displayName = 'TransactionRow';

export default TransactionRow;
