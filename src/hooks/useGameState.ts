import { useState, useEffect, useCallback } from 'react';
import { GameState, Event, RoundResult } from '@/types/game';
import { calculateDistance, getDistanceInUnit } from '@/utils/gameUtils';
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
    condition: (gameState) => gameState.roundResults.every(result => result.distance <= 10 && Math.abs(result.yearError) <= 5),
  },
  {
    id: 'streak-5',
    title: '5 Game Streak',
    description: 'Won 5 games in a row!',
    icon: '/streak.svg',
    condition: () => false, // This would require tracking game history, implement later
  },
];

const calculateTotalScore = (roundResults: RoundResult[]): number => {
  return roundResults.reduce((acc, result) => acc + result.score, 0);
};

const initHints = (maxHints = 2) => ({
  available: maxHints,
  used: [],
  yearHintUsed: false,
  locationHintUsed: false
});

export const useGameState = (events: Event[], gameMode: string, timerEnabled: boolean, timerDuration: number, maxRounds: number, maxHints: number) => {
  const { user, profile } = useAuth();
  const totalRounds = Math.min(maxRounds, events.length);
  const [gameState, setGameState] = useState<GameState>({
    events: events.slice(0, totalRounds),
    currentRound: 1,
    gameStatus: 'loading',
    selectedLocation: null,
    selectedYear: null,
    roundResults: [],
    totalScore: 0,
    currentEvent: events[0],
    gameMode: gameMode,
    settings: {
      timerEnabled: timerEnabled,
      timerDuration: timerDuration,
      maxRounds: totalRounds,
      maxHints: maxHints
    },
    hints: initHints(maxHints),
    currentGuess: null
  });
  const [view, setView] = useState<'map' | 'photo'>('map');
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { currentRound, settings, currentEvent, gameStatus, hints, selectedLocation, selectedYear } = gameState;
  const distanceUnit = profile?.default_distance_unit || 'km';
  const userAvatar = profile?.avatar_url;

  useEffect(() => {
    if (events.length > 0) {
      setGameState(prev => ({
        ...prev,
        events: events.slice(0, totalRounds),
        currentEvent: events[0],
        gameStatus: 'ready',
        settings: {
          ...prev.settings,
          maxRounds: totalRounds
        }
      }));
    }
  }, [events, totalRounds]);

  useEffect(() => {
    if (gameStatus === 'completed') {
      const earnedAchievements = achievementsList.filter(achievement => achievement.condition(gameState));
      setAchievements(earnedAchievements);
    }
  }, [gameStatus, gameState]);

  const startNextRound = useCallback(() => {
    if (currentRound < totalRounds) {
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
        gameStatus: 'completed'
      }));
    }
  }, [currentRound, totalRounds]);

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
    if (!selectedLocation || !selectedYear || !currentEvent) return;

    const distance = calculateDistance(
      selectedLocation.lat,
      selectedLocation.lng,
      currentEvent.latitude,
      currentEvent.longitude
    );

    const distanceInUnit = getDistanceInUnit(distance, distanceUnit);
    const yearError = selectedYear - currentEvent.year;
    const locationScore = Math.max(0, 100 - (distanceInUnit / 1000) * 100); // Example scoring
    const yearScore = Math.max(0, 100 - (Math.abs(yearError) / 50) * 100); // Example scoring
    const score = Math.round((locationScore + yearScore) / 2);

    const result: RoundResult = {
      distance: distanceInUnit,
      yearError: yearError,
      score: score,
      location: selectedLocation,
      year: selectedYear,
      eventId: currentEvent.id
    };

    setRoundResult(result);

    setGameState(prev => ({
      ...prev,
      gameStatus: 'show-result',
      roundResults: [...prev.roundResults, result],
      totalScore: calculateTotalScore([...prev.roundResults, result]),
      currentGuess: {
        location: selectedLocation,
        year: selectedYear
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
            round_results: result,
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
  }, [selectedLocation, selectedYear, currentEvent, distanceUnit, user, startNextRound]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentRound: 1,
      gameStatus: 'ready',
      selectedLocation: null,
      selectedYear: null,
      roundResults: [],
      totalScore: 0,
      currentEvent: events[0],
      hints: initHints(settings.maxHints),
      currentGuess: null
    }));
    setAchievements([]);
  }, [events, settings.maxHints]);

  const useHint = useCallback((hintType: string) => {
    setGameState(prev => {
      if (prev.hints.available <= 0) return prev;
      
      const updatedHints = {
        ...prev.hints,
        available: prev.hints.available - 1,
        used: [...prev.hints.used, hintType]
      };
      
      if (hintType === 'year') {
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
