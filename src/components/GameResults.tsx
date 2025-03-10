
import React from 'react';
import { RoundResult } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/gameUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, RotateCcw } from 'lucide-react';

interface GameResultsProps {
  results: RoundResult[];
  onRestart: () => void;
  onHome: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ 
  results, 
  onRestart,
  onHome
}) => {
  const totalScore = results.reduce((sum, result) => sum + result.totalScore, 0);
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Game Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Total Score</h3>
            <p className="text-4xl font-bold">{formatNumber(totalScore)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              out of {formatNumber(results.length * 10000)} possible points
            </p>
          </div>
          
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
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button onClick={onRestart} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
          <Button variant="outline" onClick={onHome} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameResults;
