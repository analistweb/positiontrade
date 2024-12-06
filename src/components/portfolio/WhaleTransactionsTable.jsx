import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon, ArrowRightFromLine, ArrowLeftFromLine } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const getTransactionType = (from, to) => {
  if (from?.includes('exchange') && !to?.includes('exchange')) {
    return {
      type: 'ACUMULAÇÃO',
      description: 'Saída de corretora para carteira pessoal - Sinal geralmente positivo, indica acumulação',
      icon: <ArrowRightFromLine className="h-4 w-4 text-green-500" />,
      badgeColor: 'bg-green-100 text-green-800'
    };
  }
  if (!from?.includes('exchange') && to?.includes('exchange')) {
    return {
      type: 'DISTRIBUIÇÃO',
      description: 'Entrada em corretora vinda de carteira pessoal - Sinal geralmente negativo, indica possível venda',
      icon: <ArrowLeftFromLine className="h-4 w-4 text-red-500" />,
      badgeColor: 'bg-red-100 text-red-800'
    };
  }
  return {
    type: 'NEUTRO',
    description: 'Movimentação entre carteiras do mesmo tipo',
    icon: null,
    badgeColor: 'bg-gray-100 text-gray-800'
  };
};

const WhaleTransactionsTable = ({ data }) => {
  if (!data?.length) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Horário</TableHead>
          <TableHead>Volume (USD)</TableHead>
          <TableHead>Tipo de Movimento</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Destino</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.slice(0, 10).map((transaction, index) => {
          const transactionType = getTransactionType(transaction.from, transaction.to);
          return (
            <TableRow key={index}>
              <TableCell>{transaction?.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}</TableCell>
              <TableCell>${transaction?.volume?.toLocaleString() ?? 'N/A'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transactionType.icon}
                  <Badge className={`${transactionType.badgeColor}`}>
                    {transactionType.type}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{transactionType.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell>{transaction?.from ?? 'N/A'}</TableCell>
              <TableCell>{transaction?.to ?? 'N/A'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default WhaleTransactionsTable;