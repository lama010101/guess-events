
import React, { useState } from 'react';
import GameControls from './game/GameControls';
import GameContent from './game/GameContent';
import GameHints from './game/GameHints';
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

  const handleViewChange = (view: 'photo' | 'map') => {
    setActiveView(view);
  };

  return (
    <div className="container mx-auto min-h-screen bg-[#f3f3f3]">
      <div className="pt-20 pb-24">
        <GameControls 
          gameState={gameState}
          activeView={activeView}
          onViewChange={handleViewChange}
          onYearSelect={onYearSelect}
          onTimeUp={onTimeUp}
          onSubmitGuess={onSubmitGuess}
        />
        
        <GameContent 
          activeView={activeView}
          gameState={gameState}
          onLocationSelect={onLocationSelect}
        />
        
        <GameHints 
          gameState={gameState}
          onTimeHint={onTimeHint}
          onLocationHint={onLocationHint}
        />
      </div>
    </div>
  );
};

export default GameView;
