
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
  const [localDailyCompleted, setLocalDailyCompleted] = useState(dailyCompleted);
  const [localDailyScore, setLocalDailyScore] = useState(dailyScore);
  const todayDate = format(new Date(), 'MMMM d, yyyy');

  // Check if user completed daily challenge if not passed in props
  useEffect(() => {
    if (user && !dailyCompleted) {
      const checkDailyCompletion = async () => {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { data, error } = await supabase
            .from('game_results')
            .select('*, game_sessions(*)')
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString())
            .eq('game_sessions.game_mode', 'daily')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            setLocalDailyCompleted(true);
            setLocalDailyScore(data[0].total_score);
          }
        } catch (error) {
          console.error('Error checking daily completion:', error);
        }
      };
      
      checkDailyCompletion();
    } else {
      // Use props values
      setLocalDailyCompleted(dailyCompleted);
      setLocalDailyScore(dailyScore);
    }
  }, [user, dailyCompleted, dailyScore]);

  const handleDailyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Daily competition button clicked');
    
    // If user completed daily competition, don't allow them to start again
    if (localDailyCompleted) {
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

  if (localDailyCompleted) {
    return (
      <Button 
        className="w-full" 
        size="lg" 
        variant="default"
        onClick={handleDailyClick}
        type="button"
        disabled
      >
        <Lock className="mr-2 h-4 w-4" /> 
        Daily Competition Completed ({todayDate}): {localDailyScore.toLocaleString()}
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
