
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, ShieldAlert, Lock } from 'lucide-react';
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
      >
        <Lock className="mr-2 h-4 w-4" /> Daily Competition Completed ({todayDate}): {dailyScore}
      </Button>
    );
  }

  return (
    <Button 
      className="w-full" 
      size="lg" 
      variant={user ? "default" : "outline"}
      onClick={handleDailyClick}
    >
      <Trophy className="mr-2 h-4 w-4" /> Daily Competition ({todayDate})
      {!user && (
        <span className="ml-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <ShieldAlert className="ml-1 h-3 w-3" /> Sign in required
        </span>
      )}
    </Button>
  );
};

export default DailyCompetitionButton;
