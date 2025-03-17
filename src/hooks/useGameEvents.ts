
import { useState } from 'react';
import { HistoricalEvent, GameSettings, GameState } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { fetchRandomHistoricalEvents } from '@/integrations/supabase/events';

export const useGameEvents = () => {
  const { toast } = useToast();
  
  const startGame = async (settings: GameSettings, profile: any) => {
    try {
      toast({
        title: "Loading Game",
        description: "Fetching historical events...",
      });
      
      // Fetch events from the database
      const fetchedEvents = await fetchRandomHistoricalEvents(5);
      
      if (fetchedEvents.length === 0) {
        toast({
          title: "Error",
          description: "No historical events found. Please try again or contact support.",
          variant: "destructive"
        });
        return null;
      }
      
      // Map the database events to the game format if needed
      const gameEvents = fetchedEvents.map(event => ({
        ...event,
        gameMode: settings.gameMode
      }));
      
      const initialGameState: GameState = {
        settings: {
          ...settings,
          distanceUnit: profile?.default_distance_unit || settings.distanceUnit
        },
        events: gameEvents,
        currentRound: 1,
        totalRounds: gameEvents.length,
        roundResults: [],
        gameStatus: 'in-progress' as const,
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
      };

      // Set URL parameters for the new game
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('round', '1');
      window.history.replaceState({}, '', currentUrl.toString());
      
      return initialGameState;
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        title: "Error",
        description: "Failed to load historical events. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };
  
  const calculateCumulativeScore = (roundResults: any[]) => {
    return roundResults.reduce((sum, result) => sum + result.totalScore, 0);
  };
  
  return {
    startGame,
    calculateCumulativeScore
  };
};

export default useGameEvents;
