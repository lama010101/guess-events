
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  GameSettings, 
  GameState
} from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Import our new specialized hooks
import useGameEvents from './useGameEvents';
import useGameGuess from './useGameGuess';
import useGameNavigation from './useGameNavigation';
import useGameSettings from './useGameSettings';
import useGameTimer from './useGameTimer';
import useHints from './useHints';

export const useGameState = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Initialize game state with default values
  const [gameState, setGameState] = useState<GameState>({
    settings: {
      distanceUnit: profile?.default_distance_unit || 'km',
      timerEnabled: false,
      timerDuration: 5,
      gameMode: 'daily',
      hintsEnabled: true,
      maxHints: 2
    },
    events: [],
    currentRound: 1,
    totalRounds: 5,
    roundResults: [],
    gameStatus: 'not-started',
    currentGuess: null,
    hints: {
      available: 2,
      timeHintUsed: false,
      locationHintUsed: false
    }
  });

  // Use specialized hooks
  const { startGame, calculateCumulativeScore } = useGameEvents();
  
  const { 
    handleLocationSelect, 
    handleYearSelect, 
    handleTimeUp, 
    submitGuess 
  } = useGameGuess(gameState, setGameState);
  
  const { navigateToRound, handleNextRound } = useGameNavigation({
    currentRound: gameState.currentRound,
    sessionId: gameState.sessionId || '',
    isGameActive: gameState.gameStatus === 'in-progress',
    setCurrentRound: (round) => setGameState(prev => ({...prev, currentRound: round}))
  });
  
  const { handleSettingsChange } = useGameSettings(gameState, setGameState, profile);
  
  // Use the updated hints hook
  const { 
    handleTimeHint, 
    handleLocationHint, 
    watchAdForHints,
    hintCoins
  } = useHints(gameState, setGameState);
  
  // Initialize the timer
  useGameTimer(gameState, setGameState, handleTimeUp);

  // Main function to start a new game
  const handleStartGame = async (settings: GameSettings) => {
    const newGameState = await startGame(settings, profile);
    if (newGameState) {
      setGameState(newGameState);
    }
  };

  // Wrapper for handling the next round
  const manageNextRound = () => {
    const nextRound = handleNextRound(gameState.currentRound);
    setGameState(prev => ({...prev, currentRound: nextRound}));
  };

  return {
    gameState,
    setGameState,
    startGame: handleStartGame,
    handleLocationSelect,
    handleYearSelect,
    handleTimeUp,
    submitGuess,
    handleNextRound: manageNextRound,
    handleTimeHint,
    handleLocationHint,
    watchAdForHints,
    hintCoins,
    handleSettingsChange,
    calculateCumulativeScore: () => calculateCumulativeScore(gameState.roundResults)
  };
};

export default useGameState;
