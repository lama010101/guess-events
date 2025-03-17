
import React from 'react';
import RoundResultComponent from '@/components/RoundResult';
import { RoundResult, GameState } from '@/types/game';

interface RoundResultViewProps {
  result: RoundResult;
  gameState: GameState;
  onNextRound: () => void;
}

const RoundResultView: React.FC<RoundResultViewProps> = ({ 
  result, 
  gameState, 
  onNextRound 
}) => {
  return (
    <RoundResultComponent 
      result={result} 
      onNextRound={onNextRound} 
      distanceUnit={gameState.settings.distanceUnit}
      isLastRound={gameState.currentRound === gameState.totalRounds}
      userAvatar={gameState.userAvatar}
    />
  );
};

export default RoundResultView;
