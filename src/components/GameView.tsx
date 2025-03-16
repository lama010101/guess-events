
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import GameMap from './GameMap';
import PhotoViewer from './PhotoViewer';
import YearSlider from './YearSlider';
import Timer from './Timer';
import ViewToggle from './ViewToggle';
import HintSystem from './HintSystem';
import { GameState } from '@/types/game';

interface GameViewProps {
  gameState: GameState;
  onLocationSelect: (lat: number, lng: number) => void;
  onYearSelect: (year: number) => void;
  onTimeUp: () => void;
  onSubmitGuess: () => void;
  onTimeHint: () => void;
  onLocationHint: () => void;
}

const GameView: React.FC<GameViewProps> = ({
  gameState,
  onLocationSelect,
  onYearSelect,
  onTimeUp,
  onSubmitGuess,
  onTimeHint,
  onLocationHint
}) => {
  const [activeView, setActiveView] = useState<'photo' | 'map'>('photo');
  const currentEvent = gameState.events[gameState.currentRound - 1];

  const handleViewChange = (view: 'photo' | 'map') => {
    setActiveView(view);
  };

  return (
    <div className="container mx-auto min-h-screen bg-[#f3f3f3]">
      <div className="pt-20 pb-24">
        <div className="mb-4 mt-2">
          {gameState.settings.timerEnabled && (
            <div className="mb-4">
              <Timer 
                durationMinutes={gameState.settings.timerDuration}
                onTimeUp={onTimeUp}
                isActive={gameState.gameStatus === 'in-progress'}
                remainingSeconds={gameState.timerRemaining}
              />
            </div>
          )}
          
          <div className="w-full">
            <YearSlider 
              value={gameState.currentGuess?.year || 1962}
              onChange={onYearSelect}
              minYear={1900}
              maxYear={new Date().getFullYear()}
            />
          </div>
        </div>
        
        <ViewToggle 
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        
        <div className="h-96 mb-6 relative z-30">
          {activeView === 'photo' ? (
            <PhotoViewer src={currentEvent.imageUrl} alt="" />
          ) : (
            <GameMap 
              onLocationSelect={onLocationSelect} 
              selectedLocation={gameState.currentGuess?.location}
              userAvatar={gameState.userAvatar}
              locationHint={gameState.hints.locationHintRegion}
            />
          )}
        </div>
        
        {/* Add hint systems between map and submit button */}
        {gameState.settings.hintsEnabled && (
          <div className="mb-4">
            <HintSystem
              onTimeHint={onTimeHint}
              onLocationHint={onLocationHint}
              timeHintUsed={gameState.hints.timeHintUsed}
              locationHintUsed={gameState.hints.locationHintUsed}
              hintsAvailable={gameState.hints.available}
              timeHintRange={gameState.hints.timeHintRange}
              locationHintRegion={gameState.hints.locationHintRegion}
            />
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-md border-t border-gray-200">
        <div className="container mx-auto p-4">
          <Button 
            size="lg"
            onClick={onSubmitGuess}
            disabled={!gameState.currentGuess?.year}
            className="w-full"
          >
            Submit Guess
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameView;
