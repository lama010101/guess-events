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

  // Sync round parameter from URL on initial load and after refreshes
  useEffect(() => {
    if (gameState.gameStatus === 'in-progress' || gameState.events.length > 0) {
      const params = new URLSearchParams(location.search);
      const roundParam = params.get('round');
      
      if (roundParam) {
        const round = parseInt(roundParam);
        if (!isNaN(round) && round >= 1 && round <= gameState.totalRounds && round !== gameState.currentRound) {
          console.log(`Restoring game state to round ${round} from URL parameter`);
          
          // Check if this round has already been completed
          const isRoundCompleted = gameState.roundResults.some(
            (result, index) => index === round - 1
          );
          
          if (isRoundCompleted) {
            // If round is already completed, set status to round-result
            setGameState(prev => ({
              ...prev,
              currentRound: round,
              gameStatus: 'round-result'
            }));
          } else {
            // Otherwise set to in-progress with fresh hints
            setGameState(prev => ({
              ...prev,
              currentRound: round,
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
                locationHintUsed: false,
                timeHintRange: undefined,
                locationHintRegion: undefined
              }
            }));
          }
        }
      }
    }
  }, [location.search, gameState.events.length]);
  
  // Handle saving game state to sessionStorage for persistence
  useEffect(() => {
    if (gameState.events.length > 0) {
      sessionStorage.setItem('gameState', JSON.stringify(gameState));
    }
  }, [gameState]);
  
  // Restore game state from sessionStorage on refresh/navigate
  useEffect(() => {
    const savedGameState = sessionStorage.getItem('gameState');
    if (savedGameState && gameState.gameStatus === 'not-started') {
      try {
        const parsedState = JSON.parse(savedGameState) as GameState;
        
        // Only restore if it's a valid game state with events
        if (parsedState.events && parsedState.events.length > 0) {
          console.log('Restoring game state from session storage');
          setGameState(parsedState);
          
          // Update URL with current round
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('round', parsedState.currentRound.toString());
          window.history.replaceState({}, '', currentUrl.toString());
        }
      } catch (error) {
        console.error('Error restoring game state:', error);
      }
    }
  }, []);
  
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
