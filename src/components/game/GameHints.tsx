
import React from 'react';
import HintSystem from '@/components/HintSystem';
import { GameState } from '@/types/game';

interface GameHintsProps {
  gameState: GameState;
  onTimeHint: () => void;
  onLocationHint: () => void;
}

const GameHints: React.FC<GameHintsProps> = ({
  gameState,
  onTimeHint,
  onLocationHint
}) => {
  if (!gameState.settings.hintsEnabled) {
    return null;
  }

  return (
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
  );
};

export default GameHints;
