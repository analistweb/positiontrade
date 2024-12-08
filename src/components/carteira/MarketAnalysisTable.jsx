import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MarketAnalysisTable = ({ data }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Criptomoeda</TableHead>
          <TableHead>Preço Atual (USD)</TableHead>
          <TableHead>Volume 24h</TableHead>
          <TableHead>Variação 24h</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data || []).map((coin, index) => (
          <TableRow key={coin?.id ?? index}>
            <TableCell className="font-medium">{coin?.name ?? 'N/A'}</TableCell>
            <TableCell>${coin?.current_price?.toLocaleString() ?? 'N/A'}</TableCell>
            <TableCell>${coin?.total_volume?.toLocaleString() ?? 'N/A'}</TableCell>
            <TableCell className={coin?.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}>
              {coin?.price_change_percentage_24h?.toFixed(2) ?? 'N/A'}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MarketAnalysisTable;