
import React from 'react';
import { Trophy } from 'lucide-react';
import { formatNumber } from '@/utils/gameUtils';

interface TotalScoreCardProps {
  totalScore: number;
  isPerfectScore: boolean;
}

const TotalScoreCard: React.FC<TotalScoreCardProps> = ({ totalScore, isPerfectScore }) => {
  return (
    <div className={`${isPerfectScore ? 'bg-green-50' : 'bg-blue-50'} dark:bg-blue-900/20 rounded-lg p-4`}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Total Round Score</h3>
        <div className="flex items-center">
          {isPerfectScore && (
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          )}
          <p className={`font-bold text-xl ${isPerfectScore ? 'text-green-600' : ''}`}>
            {formatNumber(totalScore)}
          </p>
        </div>
      </div>
      
      {isPerfectScore && (
        <p className="text-green-600 font-medium mt-2">Perfect Score! Achievement unlocked.</p>
      )}
    </div>
  );
};

export default TotalScoreCard;
