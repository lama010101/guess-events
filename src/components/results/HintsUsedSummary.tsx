
import React from 'react';
import { RoundResult } from '@/types/game';

interface HintsUsedSummaryProps {
  results: RoundResult[];
}

const HintsUsedSummary: React.FC<HintsUsedSummaryProps> = ({ results }) => {
  // Calculate total hints used
  const hintsUsed = results.reduce((total, result) => {
    let count = 0;
    if (result.hintsUsed?.time) count++;
    if (result.hintsUsed?.location) count++;
    return total + count;
  }, 0);
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900/10 rounded-lg p-4 mb-2">
      <h3 className="font-semibold">Hints Used</h3>
      <p>{hintsUsed} out of {results.length * 2} possible hints</p>
    </div>
  );
};

export default HintsUsedSummary;
