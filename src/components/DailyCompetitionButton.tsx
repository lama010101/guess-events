
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
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
      variant="default"
      onClick={onStartGame}
      disabled={!user}
    >
      <Trophy className="mr-2 h-4 w-4" /> Daily Competition ({todayDate})
      {!user && " - Sign in required"}
    </Button>
  );
};

export default DailyCompetitionButton;
