
import { useState, useEffect } from 'react';
import { GameState } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

export const useGameTimer = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  handleTimeUp: () => void
) => {
  const { toast } = useToast();
  
  // Effect for timer countdown
  useEffect(() => {
    if (
      gameState.gameStatus === 'in-progress' && 
      gameState.settings.timerEnabled && 
      gameState.timerRemaining !== undefined && 
      gameState.timerStartTime !== undefined
    ) {
      const timerId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.timerStartTime!) / 1000);
        const remaining = Math.max(0, gameState.settings.timerDuration * 60 - elapsed);
        
        setGameState(prev => ({
          ...prev,
          timerRemaining: remaining
        }));
        
        if (remaining <= 0) {
          clearInterval(timerId);
          handleTimeUp();
          
          toast({
            title: "Time's up!",
            description: "Your guess has been submitted automatically.",
          });
        }
      }, 1000);
      
      return () => clearInterval(timerId);
    }
  }, [
    gameState.gameStatus, 
    gameState.settings.timerEnabled, 
    gameState.timerRemaining, 
    gameState.timerStartTime,
    gameState.settings.timerDuration
  ]);
};

export default useGameTimer;
