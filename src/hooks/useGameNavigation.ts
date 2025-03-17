
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { GameState } from '@/types/game';

export const useGameNavigation = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Update URL with round parameter when game is in progress
  useEffect(() => {
    if (gameState.gameStatus === 'in-progress') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('round', gameState.currentRound.toString());
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [gameState.currentRound, gameState.gameStatus]);

  // Sync round parameter from URL
  useEffect(() => {
    if (gameState.gameStatus === 'in-progress') {
      const params = new URLSearchParams(location.search);
      const roundParam = params.get('round');
      if (roundParam) {
        const round = parseInt(roundParam);
        if (!isNaN(round) && round >= 1 && round <= gameState.totalRounds && round !== gameState.currentRound) {
          setGameState(prev => ({
            ...prev,
            currentRound: round,
            currentGuess: {
              location: null,
              year: 1962
            },
            timerStartTime: prev.settings.timerEnabled ? Date.now() : undefined,
            timerRemaining: prev.settings.timerEnabled ? prev.settings.timerDuration * 60 : undefined,
            hints: {
              available: prev.settings.maxHints,
              timeHintUsed: false,
              locationHintUsed: false,
              timeHintRange: undefined,
              locationHintRegion: undefined
            }
          }));
        }
      }
    }
  }, [location.search]);
  
  const handleNextRound = () => {
    if (gameState.currentRound === gameState.totalRounds) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'game-over'
      }));
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('round');
      window.history.replaceState({}, '', currentUrl.toString());
    } else {
      const nextRound = gameState.currentRound + 1;
      setGameState(prev => ({
        ...prev,
        currentRound: nextRound,
        gameStatus: 'in-progress',
        currentGuess: {
          location: null,
          year: 1962
        },
        timerStartTime: prev.settings.timerEnabled ? Date.now() : undefined,
        timerRemaining: prev.settings.timerEnabled ? prev.settings.timerDuration * 60 : undefined,
        hints: {
          available: prev.settings.maxHints,
          timeHintUsed: false,
          locationHintUsed: false
        }
      }));
      
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('round', nextRound.toString());
      window.history.replaceState({}, '', currentUrl.toString());
    }
  };
  
  return {
    handleNextRound
  };
};

export default useGameNavigation;
