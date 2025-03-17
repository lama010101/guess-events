
import React from 'react';
import { formatNumber } from '@/utils/gameUtils';
import ShareResultsButton from './ShareResultsButton';

interface TotalScoreDisplayProps {
  totalScore: number;
  maxPossibleScore: number;
}

const TotalScoreDisplay: React.FC<TotalScoreDisplayProps> = ({ 
  totalScore,
  maxPossibleScore
}) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
      <h3 className="text-xl font-semibold mb-2">Your Total Score</h3>
      <p className="text-4xl font-bold">{formatNumber(totalScore)}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        out of {formatNumber(maxPossibleScore)} possible points
      </p>
      <div className="flex justify-center space-x-4 mt-3">
        <ShareResultsButton totalScore={totalScore} />
      </div>
    </div>
  );
};

export default TotalScoreDisplay;
