
import React from 'react';
import { Button } from "@/components/ui/button";
import Timer from '@/components/Timer';
import YearSlider from '@/components/YearSlider';
import ViewToggle from '@/components/ViewToggle';
import { GameState } from '@/types/game';

interface GameControlsProps {
  gameState: GameState;
  activeView: 'photo' | 'map';
  onViewChange: (view: 'photo' | 'map') => void;
  onYearSelect: (year: number) => void;
  onTimeUp: () => void;
  onSubmitGuess: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  activeView,
  onViewChange,
  onYearSelect,
  onTimeUp,
  onSubmitGuess
}) => {
  return (
    <>
      <div className="mb-2">
        {gameState.settings.timerEnabled && (
          <div className="mb-2">
            <Timer 
              durationMinutes={gameState.settings.timerDuration}
              onTimeUp={onTimeUp}
              isActive={gameState.gameStatus === 'in-progress'}
              remainingSeconds={gameState.timerRemaining}
            />
          </div>
        )}
        
        <div className="w-full mb-2">
          <ViewToggle 
            activeView={activeView}
            onViewChange={onViewChange}
          />
        </div>
        
        <div className="w-full mt-2">
          <YearSlider 
            value={gameState.currentGuess?.year || 1962}
            onChange={onYearSelect}
            minYear={1900}
            maxYear={new Date().getFullYear()}
          />
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-md border-t border-gray-200">
        <div className="container mx-auto p-4">
          <Button 
            size="lg"
            onClick={onSubmitGuess}
            disabled={!gameState.currentGuess?.year}
            className="w-full"
            type="button"
          >
            Submit Guess
          </Button>
        </div>
      </div>
    </>
  );
};

export default GameControls;
