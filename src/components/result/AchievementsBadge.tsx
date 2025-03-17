
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Award, Target, Clock, Star } from 'lucide-react';

interface AchievementsBadgeProps {
  achievements: {
    perfectLocation?: boolean;
    perfectTime?: boolean;
    perfect?: boolean;
  } | undefined;
}

const AchievementsBadge: React.FC<AchievementsBadgeProps> = ({ achievements }) => {
  // Check if any achievements were earned
  const hasAchievements = achievements && (
    achievements.perfectLocation || 
    achievements.perfectTime || 
    achievements.perfect
  );

  if (!hasAchievements) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-2">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Award className="h-5 w-5 text-yellow-500" />
        Achievements Unlocked
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {achievements?.perfectLocation && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <Target className="h-3 w-3" />
            Perfect Location
          </Badge>
        )}
        {achievements?.perfectTime && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Perfect Year
          </Badge>
        )}
        {achievements?.perfect && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
            <Star className="h-3 w-3" />
            Perfect Score
          </Badge>
        )}
      </div>
    </div>
  );
};

export default AchievementsBadge;
