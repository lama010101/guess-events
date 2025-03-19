
import React from 'react';
import HintSystem from '@/components/HintSystem';
import { GameState } from '@/types/game';

interface GameHintsProps {
  gameState: GameState;
  onTimeHint: () => void;
  onLocationHint: () => void;
  onWatchAd?: () => void;
  hintCoins?: number;
}

const GameHints: React.FC<GameHintsProps> = ({
  gameState,
  onTimeHint,
  onLocationHint,
  onWatchAd,
  hintCoins
}) => {
  if (!gameState.settings.hintsEnabled) {
    return null;
  }

  return (
    <div className="mb-4">
      <HintSystem
        onTimeHint={onTimeHint}
        onLocationHint={onLocationHint}
        onWatchAd={onWatchAd}
        timeHintUsed={gameState.hints.timeHintUsed}
        locationHintUsed={gameState.hints.locationHintUsed}
        hintsAvailable={gameState.hints.available}
        timeHintRange={gameState.hints.timeHintRange}
        locationHintRegion={gameState.hints.locationHintRegion}
        hintCoins={hintCoins}
        showWatchAdButton={true}
      />
    </div>
  );
};

export default GameHints;
