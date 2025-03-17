
import React from 'react';
import { RoundResult } from '@/types/game';
import { formatNumber } from '@/utils/gameUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RoundsTableProps {
  results: RoundResult[];
}

const RoundsTable: React.FC<RoundsTableProps> = ({ results }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Round</TableHead>
          <TableHead>Event Description</TableHead>
          <TableHead className="text-right">Location</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell className="max-w-xs truncate">{result.event.description}</TableCell>
            <TableCell className="text-right">{formatNumber(result.locationScore)}</TableCell>
            <TableCell className="text-right">{formatNumber(result.timeScore)}</TableCell>
            <TableCell className="text-right font-semibold">{formatNumber(result.totalScore)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RoundsTable;
