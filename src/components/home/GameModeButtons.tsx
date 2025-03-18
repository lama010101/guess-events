
import React from 'react';
import { Button } from "@/components/ui/button";
import { User, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import DailyCompetitionButton from '../DailyCompetitionButton';

interface GameModeButtonsProps {
  dailyCompleted: boolean;
  dailyScore: number;
  onStartGame: (mode: 'daily' | 'friends' | 'single') => void;
  setShowAuthPrompt: (show: boolean) => void;
}

const GameModeButtons: React.FC<GameModeButtonsProps> = ({
  dailyCompleted,
  dailyScore,
  onStartGame,
  setShowAuthPrompt
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDailyClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to play the Daily Competition.",
        variant: "destructive"
      });
      setShowAuthPrompt(true);
      return;
    }
    
    console.log("Starting daily game mode");
    onStartGame('daily');
  };

  const handleSinglePlayerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Starting single player mode");
    onStartGame('single');
  };

  const handleFriendsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to play with friends.",
        variant: "destructive"
      });
      setShowAuthPrompt(true);
      return;
    }
    
    console.log("Starting friends mode");
    onStartGame('friends');
  };

  return (
    <div className="space-y-6">
      <DailyCompetitionButton 
        dailyCompleted={dailyCompleted}
        dailyScore={dailyScore}
        user={user}
        onStartGame={handleDailyClick}
      />
      
      <Button 
        className="w-full" 
        size="lg" 
        variant="secondary"
        onClick={handleSinglePlayerClick}
        type="button"
      >
        <User className="mr-2 h-4 w-4" /> Singleplayer
      </Button>
      
      <Button 
        className="w-full"
        variant="outline"
        size="lg" 
        onClick={handleFriendsClick}
        type="button"
      >
        <Users className="mr-2 h-4 w-4" /> Play with Friends
      </Button>
    </div>
  );
};

export default GameModeButtons;
