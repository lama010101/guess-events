
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const todayDate = format(new Date(), 'MMMM d, yyyy');

  const handleDailyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Daily competition button clicked');
    
    if (dailyCompleted) {
      toast({
        title: "Already Completed",
        description: "You've already completed today's Daily Competition. Come back tomorrow!",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to play the Daily Competition.",
        variant: "destructive"
      });
      return;
    }
    
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
      className="w-full" 
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
