
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

const TransactionRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-6 w-20" />
    </TableCell>
    <TableCell>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-6 w-16" />
    </TableCell>
  </TableRow>
);

const TransactionSkeleton = () => (
  <>
    {Array(5).fill(0).map((_, index) => (
      <TransactionRowSkeleton key={index} />
    ))}
  </>
);

export default TransactionSkeleton;
