
import React from 'react';
import { Button } from "@/components/ui/button";
import DailyCompetitionButton from '@/components/DailyCompetitionButton';
import { Gamepad2, Users2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  
  const handleFriendsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    
    onStartGame('friends');
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Game Modes</h3>
      
      <DailyCompetitionButton 
        dailyCompleted={dailyCompleted}
        dailyScore={dailyScore}
        user={user}
        onStartGame={() => onStartGame('daily')}
      />
      
      <Button 
        className="w-full" 
        size="lg" 
        variant="outline"
        onClick={handleFriendsClick}
        type="button"
      >
        <Users2 className="mr-2 h-4 w-4" /> Play with Friends
      </Button>
      
      <Button 
        className="w-full" 
        size="lg" 
        variant="outline"
        onClick={() => onStartGame('single')}
        type="button"
      >
        <Gamepad2 className="mr-2 h-4 w-4" /> Single Player Mode
      </Button>
    </div>
  );
};

export default GameModeButtons;
