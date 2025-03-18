
import React from 'react';
import GameHeader from '@/components/GameHeader';
import { GameState } from '@/types/game';

interface GameContainerProps {
  gameState: GameState;
  children: React.ReactNode;
  onShare: () => void;
  onSettingsClick: () => void;
  onHomeClick: () => void;
  cumulativeScore: number;
}

const GameContainer: React.FC<GameContainerProps> = ({ 
  gameState, 
  children, 
  onShare, 
  onSettingsClick, 
  onHomeClick, 
  cumulativeScore 
}) => {
  return (
    <div className="container mx-auto min-h-screen bg-[#f3f3f3]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="container mx-auto p-4">
          <GameHeader 
            currentRound={gameState.currentRound} 
            totalRounds={gameState.totalRounds}
            cumulativeScore={cumulativeScore}
            onShare={onShare}
            onHomeClick={onHomeClick}
          />
        </div>
      </div>
      
      <div className={gameState.gameStatus === 'round-result' ? "pt-20 pb-24" : "pt-20"}>
        {children}
      </div>
    </div>
  );
};

export default GameContainer;
