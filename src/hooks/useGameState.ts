import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  GameSettings, 
  GameState, 
  PlayerGuess, 
  HistoricalEvent,
  RoundResult 
} from '@/types/game';
import { 
  calculateRoundResult, 
  shuffleArray 
} from '@/utils/gameUtils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { sampleEvents } from '@/data/sampleEvents';

export const useGameState = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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

  // Update distance unit when profile changes
  useEffect(() => {
    if (profile) {
      setGameState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          distanceUnit: profile.default_distance_unit || prev.settings.distanceUnit
        },
        userAvatar: profile.avatar_url
      }));
    }
  }, [profile]);

  // Set active view to photo when starting a new round
  useEffect(() => {
    if (gameState.gameStatus === 'in-progress') {
      // This would be handled by the ViewToggle component now
    }
  }, [gameState.currentRound, gameState.gameStatus]);

  const startGame = (settings: GameSettings) => {
    const shuffledEvents = shuffleArray(sampleEvents)
      .slice(0, 5)
      .map(event => ({
        ...event,
        gameMode: settings.gameMode
      }));
    
    setGameState({
      settings: {
        ...settings,
        distanceUnit: profile?.default_distance_unit || settings.distanceUnit
      },
      events: shuffledEvents,
      currentRound: 1,
      totalRounds: 5,
      roundResults: [],
      gameStatus: 'in-progress',
      currentGuess: {
        location: null,
        year: 1962
      },
      timerStartTime: settings.timerEnabled ? Date.now() : undefined,
      timerRemaining: settings.timerEnabled ? settings.timerDuration * 60 : undefined,
      userAvatar: profile?.avatar_url,
      hints: {
        available: settings.maxHints,
        timeHintUsed: false,
        locationHintUsed: false
      }
    });

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('round', '1');
    window.history.replaceState({}, '', currentUrl.toString());
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    console.log("Location selected:", lat, lng);
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { year: 1962 }),
        location: { lat, lng }
      }
    }));
  };

  const handleYearSelect = (year: number) => {
    console.log("Year selected:", year);
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { location: null }),
        year
      }
    }));
  };

  const handleTimeUp = () => {
    console.log("Timer expired, submitting current guess");
    const currentEvent = gameState.events[gameState.currentRound - 1];
    const currentGuess = gameState.currentGuess || { location: null, year: 1962 };
    
    let result: RoundResult;
    
    if (currentGuess.location) {
      result = calculateRoundResult(currentEvent, currentGuess);
    } else {
      const yearError = Math.abs(currentEvent.year - currentGuess.year);
      result = {
        event: currentEvent,
        guess: currentGuess,
        distanceError: Infinity,
        yearError,
        locationScore: 0,
        timeScore: Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9)))),
        totalScore: 0
      };
      result.totalScore = result.locationScore + result.timeScore;
    }

    setGameState(prev => ({
      ...prev,
      roundResults: [...prev.roundResults, result],
      gameStatus: 'round-result'
    }));

    toast({
      title: "Time's up!",
      description: "Your guess has been submitted automatically.",
    });
  };

  const submitGuess = () => {
    console.log("Submitting guess:", gameState.currentGuess);
    if (!gameState.currentGuess) {
      toast({
        title: "Missing guess",
        description: "Please select both a location and a year.",
        variant: "destructive"
      });
      return;
    }

    if (!gameState.currentGuess.location) {
      toast({
        title: "No location selected",
        description: "You'll only receive points for your year guess.",
      });
      
      const currentEvent = gameState.events[gameState.currentRound - 1];
      const yearError = Math.abs(currentEvent.year - gameState.currentGuess.year);
      const timeScore = Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9))));
      
      const isPerfectTime = yearError === 0;
      
      const result: RoundResult = {
        event: currentEvent,
        guess: gameState.currentGuess,
        distanceError: Infinity,
        yearError,
        locationScore: 0,
        timeScore,
        totalScore: timeScore,
        hintsUsed: {
          time: gameState.hints.timeHintUsed,
          location: gameState.hints.locationHintUsed
        },
        achievements: {
          perfectTime: isPerfectTime
        }
      };

      setGameState(prev => ({
        ...prev,
        roundResults: [...prev.roundResults, result],
        gameStatus: 'round-result'
      }));
      
      return;
    }

    const currentEvent = gameState.events[gameState.currentRound - 1];
    const result = calculateRoundResult(currentEvent, gameState.currentGuess);
    
    result.hintsUsed = {
      time: gameState.hints.timeHintUsed,
      location: gameState.hints.locationHintUsed
    };

    setGameState(prev => ({
      ...prev,
      roundResults: [...prev.roundResults, result],
      gameStatus: 'round-result'
    }));
  };

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

  const handleTimeHint = () => {
    if (gameState.hints.available > 0 && !gameState.hints.timeHintUsed) {
      const currentEvent = gameState.events[gameState.currentRound - 1];
      const year = currentEvent.year;
      const range = 60; // 60-year range initially (will be halved)
      const min = Math.max(1900, year - range / 2);
      const max = Math.min(new Date().getFullYear(), year + range / 2);
      
      setGameState(prev => ({
        ...prev,
        hints: {
          ...prev.hints,
          available: prev.hints.available - 1,
          timeHintUsed: true,
          timeHintRange: { min, max }
        }
      }));
      
      toast({
        title: "Time Hint Used",
        description: `The event occurred between ${min} and ${max}.`,
      });
    }
  };
  
  const handleLocationHint = () => {
    if (gameState.hints.available > 0 && !gameState.hints.locationHintUsed) {
      const currentEvent = gameState.events[gameState.currentRound - 1];
      
      setGameState(prev => ({
        ...prev,
        hints: {
          ...prev.hints,
          available: prev.hints.available - 1,
          locationHintUsed: true,
          locationHintRegion: {
            lat: currentEvent.location.lat,
            lng: currentEvent.location.lng,
            radiusKm: 500
          }
        }
      }));
      
      toast({
        title: "Location Hint Used",
        description: "A highlighted region has been added to the map.",
      });
    }
  };

  const handleSettingsChange = (newSettings: GameSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: {
        ...newSettings,
        distanceUnit: profile?.default_distance_unit || newSettings.distanceUnit
      },
      timerRemaining: newSettings.timerEnabled 
        ? newSettings.timerDuration * 60 
        : undefined
    }));
  };

  const calculateCumulativeScore = () => {
    return gameState.roundResults.reduce((sum, result) => sum + result.totalScore, 0);
  };

  return {
    gameState,
    setGameState,
    startGame,
    handleLocationSelect,
    handleYearSelect,
    handleTimeUp,
    submitGuess,
    handleNextRound,
    handleTimeHint,
    handleLocationHint,
    handleSettingsChange,
    calculateCumulativeScore
  };
};

export default useGameState;
