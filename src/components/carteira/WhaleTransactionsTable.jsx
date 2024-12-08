import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WalletIcon, BuildingIcon, ArrowRightLeft, ArrowRight, CoinIcon } from 'lucide-react';

const getTransactionType = (type, exchange, fromAddress, toAddress) => {
  if (type === 'withdrawal' && exchange) {
    return {
      type: 'ACUMULAÇÃO',
      description: 'Saída da corretora para carteira pessoal - Indica possível acumulação de longo prazo',
      icon: <WalletIcon className="h-4 w-4" />,
      color: 'bg-green-500',
      flow: 'Corretora → Carteira Pessoal'
    };
  }
  if (type === 'deposit' && exchange) {
    return {
      type: 'DISTRIBUIÇÃO',
      description: 'Entrada na corretora vinda de carteira pessoal - Possível preparação para venda',
      icon: <BuildingIcon className="h-4 w-4" />,
      color: 'bg-yellow-500',
      flow: 'Carteira Pessoal → Corretora'
    };
  }
  return {
    type: 'TRANSFERÊNCIA',
    description: 'Movimentação entre carteiras - Possível reorganização de portfólio',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: 'bg-blue-500',
    flow: 'Carteira → Carteira'
  };
};

const formatAddress = (address) => {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const WhaleTransactionsTable = ({ transactions }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Horário</TableHead>
          <TableHead>Criptomoeda</TableHead>
          <TableHead>Volume (USD)</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Destino</TableHead>
          <TableHead>Fluxo</TableHead>
          <TableHead>Análise</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(transactions || []).slice(0, 10).map((transaction, index) => {
          const transactionInfo = getTransactionType(
            transaction?.type,
            transaction?.exchange,
            transaction?.fromAddress,
            transaction?.toAddress
          );
          
          return (
            <TableRow key={index}>
              <TableCell>
                {transaction?.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CoinIcon className="h-4 w-4" />
                  <span className="font-medium">{transaction?.cryptocurrency || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell>${transaction?.volume?.toLocaleString() ?? 'N/A'}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="font-mono text-sm">
                        {formatAddress(transaction?.fromAddress)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Endereço completo: {transaction?.fromAddress || 'N/A'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="font-mono text-sm">
                        {formatAddress(transaction?.toAddress)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Endereço completo: {transaction?.toAddress || 'N/A'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction?.fromType}
                  <ArrowRight className="h-4 w-4" />
                  {transaction?.toType}
                </div>
              </TableCell>
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
                      <p className="text-sm mt-1 font-medium">{transactionInfo.flow}</p>
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