
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw } from 'lucide-react';

interface GameActionButtonsProps {
  onRestart: () => void;
  onHome: () => void;
  isDailyMode: boolean;
}

const GameActionButtons: React.FC<GameActionButtonsProps> = ({ 
  onRestart, 
  onHome, 
  isDailyMode 
}) => {
  return (
    <div className="flex justify-center space-x-4 gap-4">
      {!isDailyMode && (
        <Button onClick={onRestart} className="flex items-center gap-2 flex-1">
          <RotateCcw className="h-4 w-4" />
          Play Again
        </Button>
      )}
      <Button 
        variant={isDailyMode ? "default" : "outline"} 
        onClick={onHome} 
        className="flex items-center gap-2 flex-1"
      >
        <Home className="h-4 w-4" />
        Return to Home
      </Button>
    </div>
  );
};

export default GameActionButtons;
