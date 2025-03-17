
import { useState } from 'react';
import { GameState, PlayerGuess, RoundResult } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { calculateRoundResult } from '@/utils/gameUtils';

export const useGameGuess = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const { toast } = useToast();
  
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

  return {
    handleLocationSelect,
    handleYearSelect,
    handleTimeUp,
    submitGuess
  };
};

export default useGameGuess;
