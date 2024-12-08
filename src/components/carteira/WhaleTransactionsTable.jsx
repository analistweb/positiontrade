import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WalletIcon, BuildingIcon, ArrowRightLeft } from 'lucide-react';

const getTransactionType = (type, exchange) => {
  if (type === 'withdrawal' && exchange) {
    return {
      type: 'ACUMULAÇÃO',
      description: 'Saída da corretora para carteira pessoal - Indica possível acumulação de longo prazo',
      icon: <WalletIcon className="h-4 w-4" />,
      color: 'bg-green-500'
    };
  }
  if (type === 'deposit' && exchange) {
    return {
      type: 'DISTRIBUIÇÃO',
      description: 'Entrada na corretora vinda de carteira pessoal - Possível preparação para venda',
      icon: <BuildingIcon className="h-4 w-4" />,
      color: 'bg-yellow-500'
    };
  }
  return {
    type: 'TRANSFERÊNCIA',
    description: 'Movimentação entre carteiras - Possível reorganização de portfólio',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: 'bg-blue-500'
  };
};

const WhaleTransactionsTable = ({ transactions }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Horário</TableHead>
          <TableHead>Volume (USD)</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Exchange</TableHead>
          <TableHead>Análise de Fluxo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(transactions || []).slice(0, 10).map((transaction, index) => {
          const transactionInfo = getTransactionType(transaction?.type, transaction?.exchange);
          return (
            <TableRow key={index}>
              <TableCell>
                {transaction?.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell>${transaction?.volume?.toLocaleString() ?? 'N/A'}</TableCell>
              <TableCell>{transaction?.type ?? 'N/A'}</TableCell>
              <TableCell>{transaction?.exchange ?? 'N/A'}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className={`${transactionInfo.color} text-white flex items-center gap-1`}>
                        {transactionInfo.icon}
                        {transactionInfo.type}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{transactionInfo.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default WhaleTransactionsTable;