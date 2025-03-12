
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, ShieldAlert, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface DailyCompetitionButtonProps {
  dailyCompleted: boolean;
  dailyScore: number;
  user: any;
  onStartGame: () => void;
  isLoading?: boolean;
}

const DailyCompetitionButton: React.FC<DailyCompetitionButtonProps> = ({
  dailyCompleted,
  dailyScore,
  user,
  onStartGame,
  isLoading = false
}) => {
  const todayDate = format(new Date(), 'MMMM d, yyyy');

  if (dailyCompleted) {
    return (
      <Button 
        className="w-full" 
        size="lg" 
        variant="default"
        disabled
      >
        <Trophy className="mr-2 h-4 w-4" /> Daily Competition Completed ({todayDate}): {dailyScore}
      </Button>
    );
  }

  return (
    <Button 
      className="w-full" 
      size="lg" 
      variant={user ? "default" : "outline"}
      onClick={onStartGame}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Trophy className="mr-2 h-4 w-4" /> Daily Competition ({todayDate})
          {!user && (
            <span className="ml-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <ShieldAlert className="ml-1 h-3 w-3" /> Sign in required
            </span>
          )}
        </>
      )}
    </Button>
  );
};

export default DailyCompetitionButton;
