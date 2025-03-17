
import React from 'react';
import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RoundResult } from '@/types/game';

interface AchievementsSummaryProps {
  results: RoundResult[];
}

const AchievementsSummary: React.FC<AchievementsSummaryProps> = ({ results }) => {
  // Calculate achievements
  const achievements = {
    perfectLocations: results.filter(r => r.achievements?.perfectLocation).length,
    perfectYears: results.filter(r => r.achievements?.perfectTime).length,
    perfectScores: results.filter(r => r.achievements?.perfect).length
  };
  
  if (achievements.perfectLocations === 0 && achievements.perfectYears === 0 && achievements.perfectScores === 0) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-2">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Award className="h-5 w-5 text-yellow-500" />
        Achievements Summary
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {achievements.perfectLocations > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {achievements.perfectLocations} Perfect Locations
          </Badge>
        )}
        {achievements.perfectYears > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {achievements.perfectYears} Perfect Years
          </Badge>
        )}
        {achievements.perfectScores > 0 && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {achievements.perfectScores} Perfect Scores
          </Badge>
        )}
      </div>
    </div>
  );
};

export default AchievementsSummary;
