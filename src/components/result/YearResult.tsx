
import React from 'react';
import { formatNumber } from '@/utils/gameUtils';

interface YearResultProps {
  yearError: number;
  timeScore: number;
  guessedYear: number;
  actualYear: number;
  isPerfectYear: boolean;
  timeHintUsed?: boolean;
}

const YearResult: React.FC<YearResultProps> = ({
  yearError,
  timeScore,
  guessedYear,
  actualYear,
  isPerfectYear,
  timeHintUsed
}) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-2">Year</h3>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your guess was</p>
          {isPerfectYear ? (
            <p className="font-medium text-green-500">Perfect!</p>
          ) : (
            <p className="font-medium">{Math.abs(yearError)} years away</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You guessed: {guessedYear} | Actual: {actualYear}
          </p>
          
          {timeHintUsed && (
            <p className="text-xs text-orange-500 mt-1">
              Used time hint
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
          <p className="font-medium">{formatNumber(timeScore)}</p>
        </div>
      </div>
    </div>
  );
};

export default YearResult;
