
import { useState, useEffect, useCallback } from 'react';
import { GameState, HistoricalEvent, Event, RoundResult, PlayerGuess } from '@/types/game';
import { calculateDistance, getDistanceInUnit, calculateTotalScore } from '@/utils/gameUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (gameState: GameState) => boolean;
}

const achievementsList: Achievement[] = [
  {
    id: 'first-game',
    title: 'First Game',
    description: 'Played your first game!',
    icon: '/trophy.svg',
    condition: () => true,
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Got a perfect score in a game!',
    icon: '/perfect-score.svg',
    condition: (gameState) => gameState.roundResults.every(result => 
      (result.distanceError || result.distance || 0) <= 10 && 
      Math.abs(result.yearError || 0) <= 5
    ),
  },
  {
    id: 'streak-5',
    title: '5 Game Streak',
    description: 'Won 5 games in a row!',
    icon: '/streak.svg',
    condition: () => false, // This would require tracking game history, implement later
  },
];

const initHints = (maxHints = 2) => ({
  available: maxHints,
  timeHintUsed: false,
  locationHintUsed: false,
  yearHintUsed: false,
  used: [] as string[]
});

export const useGameState = (
  initialEvents: HistoricalEvent[] = [], 
  initialGameMode: string = 'single', 
  initialTimerEnabled: boolean = false, 
  initialTimerDuration: number = 5, 
  initialMaxRounds: number = 5, 
  initialMaxHints: number = 2
) => {
  const { user, profile } = useAuth();
  const totalRounds = Math.min(initialMaxRounds, initialEvents.length || 5);
  
  const [gameState, setGameState] = useState<GameState>({
    events: initialEvents?.slice(0, totalRounds) || [],
    currentRound: 1,
    gameStatus: 'not-started',
    selectedLocation: null,
    selectedYear: null,
    roundResults: [],
    totalScore: 0,
    currentEvent: initialEvents?.[0],
    gameMode: initialGameMode,
    currentGuess: null,
    settings: {
      timerEnabled: initialTimerEnabled,
      timerDuration: initialTimerDuration,
      maxRounds: totalRounds,
      maxHints: initialMaxHints,
      distanceUnit: profile?.default_distance_unit || 'km',
      gameMode: initialGameMode as any,
      hintsEnabled: true
    },
    hints: initHints(initialMaxHints),
    totalRounds
  });
  
  const [view, setView] = useState<'map' | 'photo'>('map');
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  const distanceUnit = profile?.default_distance_unit || 'km';
  const userAvatar = profile?.avatar_url;

  useEffect(() => {
    if (initialEvents?.length > 0) {
      setGameState(prev => ({
        ...prev,
        events: initialEvents.slice(0, totalRounds),
        currentEvent: initialEvents[0],
        gameStatus: 'ready',
        settings: {
          ...prev.settings,
          maxRounds: totalRounds
        }
      }));
    }
  }, [initialEvents, totalRounds]);

  useEffect(() => {
    if (gameState.gameStatus === 'completed' || gameState.gameStatus === 'game-over') {
      const earnedAchievements = achievementsList.filter(achievement => achievement.condition(gameState));
      setAchievements(earnedAchievements);
    }
  }, [gameState]);

  const startNextRound = useCallback(() => {
    if (gameState.currentRound < gameState.totalRounds) {
      setGameState(prev => ({
        ...prev,
        currentRound: prev.currentRound + 1,
        currentEvent: prev.events[prev.currentRound],
        gameStatus: 'in-progress',
        selectedLocation: null,
        selectedYear: null,
        currentGuess: null,
        hints: initHints(prev.settings.maxHints)
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'game-over'
      }));
    }
  }, [gameState.currentRound, gameState.totalRounds]);

  const handleMapClick = useCallback((location: { lat: number; lng: number }) => {
    setGameState(prev => ({
      ...prev,
      selectedLocation: location
    }));
  }, []);

  const handleYearSelect = useCallback((year: number | null) => {
    setGameState(prev => ({
      ...prev,
      selectedYear: year
    }));
  }, []);

  const handleSubmitGuess = useCallback(async () => {
    if (!gameState.selectedLocation || !gameState.selectedYear || !gameState.currentEvent) return;

    const currentEvent = gameState.currentEvent;
    const eventLat = currentEvent.latitude || currentEvent.location?.lat || 0;
    const eventLng = currentEvent.longitude || currentEvent.location?.lng || 0;

    const distance = calculateDistance(
      gameState.selectedLocation.lat,
      gameState.selectedLocation.lng,
      eventLat,
      eventLng
    );

    const distanceInUnit = getDistanceInUnit(distance, distanceUnit);
    const yearError = (gameState.selectedYear || 0) - (currentEvent.year || 0);
    const locationScore = Math.max(0, 100 - (distanceInUnit / 1000) * 100); // Example scoring
    const yearScore = Math.max(0, 100 - (Math.abs(yearError) / 50) * 100); // Example scoring
    const score = Math.round((locationScore + yearScore) / 2);

    // Create a basic result that matches what our components expect
    const basicResult: RoundResult = {
      distanceError: distanceInUnit,
      yearError: yearError,
      locationScore: locationScore,
      timeScore: yearScore,
      totalScore: score,
      // Legacy fields
      distance: distanceInUnit,
      score: score,
      location: gameState.selectedLocation,
      year: gameState.selectedYear,
      eventId: currentEvent.id,
      // Required fields
      event: {
        id: currentEvent.id,
        imageUrl: currentEvent.image_url || '',
        location: {
          lat: eventLat,
          lng: eventLng,
          name: 'Location'
        },
        year: currentEvent.year || 0,
        description: currentEvent.description || ''
      },
      guess: {
        location: gameState.selectedLocation,
        year: gameState.selectedYear
      }
    };

    setRoundResult(basicResult);

    setGameState(prev => ({
      ...prev,
      gameStatus: 'round-result',
      roundResults: [...prev.roundResults, basicResult],
      totalScore: calculateTotalScore([...prev.roundResults, basicResult]),
      currentGuess: {
        location: gameState.selectedLocation,
        year: gameState.selectedYear
      }
    }));

    // Persist game results to database
    if (user) {
      try {
        const { error } = await supabase
          .from('game_results')
          .insert({
            user_id: user.id,
            session_id: 'test-session', // Replace with actual session ID
            round_results: JSON.stringify(basicResult), // Convert to JSON string
            total_score: score
          });

        if (error) {
          console.error('Error saving game result:', error);
        }
      } catch (error) {
        console.error('Error saving game result:', error);
      }
    }

    setTimeout(() => {
      startNextRound();
      setRoundResult(null);
    }, 3000);
  }, [gameState.selectedLocation, gameState.selectedYear, gameState.currentEvent, distanceUnit, user, startNextRound]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentRound: 1,
      gameStatus: 'not-started',
      selectedLocation: null,
      selectedYear: null,
      roundResults: [],
      totalScore: 0,
      currentEvent: initialEvents?.[0],
      hints: initHints(gameState.settings.maxHints),
      currentGuess: null
    }));
    setAchievements([]);
  }, [initialEvents, gameState.settings.maxHints]);

  const useHint = useCallback((hintType: string) => {
    setGameState(prev => {
      if (prev.hints.available <= 0) return prev;
      
      const updatedHints = {
        ...prev.hints,
        available: prev.hints.available - 1,
        used: [...(prev.hints.used || []), hintType]
      };
      
      if (hintType === 'year') {
        updatedHints.timeHintUsed = true;
        updatedHints.yearHintUsed = true;
      } else if (hintType === 'location') {
        updatedHints.locationHintUsed = true;
      }
      
      return {
        ...prev,
        hints: updatedHints
      };
    });
  }, []);

  return {
    gameState,
    view,
    roundResult,
    achievements,
    distanceUnit,
    userAvatar,
    setView,
    handleMapClick,
    handleYearSelect,
    handleSubmitGuess,
    resetGame,
    useHint
  };
};
