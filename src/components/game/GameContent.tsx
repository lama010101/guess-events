
import React from 'react';
import GameMap from '@/components/GameMap';
import PhotoViewer from '@/components/PhotoViewer';
import { GameState } from '@/types/game';

interface GameContentProps {
  activeView: 'photo' | 'map';
  gameState: GameState;
  onLocationSelect: (lat: number, lng: number) => void;
}

const GameContent: React.FC<GameContentProps> = ({
  activeView,
  gameState,
  onLocationSelect
}) => {
  const currentEvent = gameState.events[gameState.currentRound - 1];

  return (
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
  );
};

export default GameContent;
