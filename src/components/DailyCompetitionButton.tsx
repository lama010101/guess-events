
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface DailyCompetitionButtonProps {
  dailyCompleted: boolean;
  dailyScore: number;
  user: any;
  onStartGame: () => void;
}

const DailyCompetitionButton: React.FC<DailyCompetitionButtonProps> = ({
  dailyCompleted,
  dailyScore,
  user,
  onStartGame
}) => {
  const todayDate = format(new Date(), 'MMMM d, yyyy');

  const handleDailyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Daily competition button clicked');
    
    // If user completed daily competition, don't allow them to start again
    if (dailyCompleted) {
      console.log("Daily competition already completed");
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      console.log("User not authenticated, redirecting to login");
      return;
    }
    
    // All checks passed, start the game
    onStartGame();
  };

  if (dailyCompleted) {
    return (
      <Button 
        className="w-full" 
        size="lg" 
        variant="default"
        onClick={handleDailyClick}
        type="button"
        disabled
      >
        <Lock className="mr-2 h-4 w-4" /> Daily Competition Completed ({todayDate}): {dailyScore}
      </Button>
    );
  }

  return (
    <Button 
      className="w-full pointer-events-auto" 
      size="lg" 
      variant="default"
      onClick={handleDailyClick}
      type="button"
    >
      <Trophy className="mr-2 h-4 w-4" /> Daily Competition ({todayDate})
    </Button>
  );
};

export default DailyCompetitionButton;
