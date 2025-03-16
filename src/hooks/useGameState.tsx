import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GameState, GameSettings, RoundResult, Event } from '@/types/game';
import { calculateScore, getTimeScore } from '@/utils/gameUtils';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const DEFAULT_ROUNDS = 5;

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    gameStatus: 'not-started',
    events: [],
    currentRound: 0,
    totalRounds: DEFAULT_ROUNDS,
    currentEvent: null,
    selectedLocation: null,
    selectedYear: null,
    roundResults: [],
    userAvatar: null,
    settings: {
      distanceUnit: 'km',
      timerEnabled: false,
      timerDuration: 5,
      gameMode: 'single',
      hintsEnabled: true,
      maxHints: 2
    },
    hintsUsed: { time: false, location: false },
    hintsAvailable: 2,
    gameSessionId: null,
    sessionUrl: null
  });
  
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Use profile avatar if available
  useEffect(() => {
    if (profile?.avatar_url) {
      setGameState(prev => ({
        ...prev,
        userAvatar: profile.avatar_url
      }));
    }
  }, [profile]);
  
  // Handle round parameter in URL
  useEffect(() => {
    const roundParam = searchParams.get('round');
    if (roundParam && gameState.gameStatus === 'in-progress') {
      const roundNumber = parseInt(roundParam);
      if (
        !isNaN(roundNumber) && 
        roundNumber > 0 && 
        roundNumber <= gameState.totalRounds &&
        roundNumber !== gameState.currentRound
      ) {
        // Skip to the specific round
        // This is a simplified implementation and would need more logic for a real app
        console.log(`Navigating to round ${roundNumber}`);
      }
    }
  }, [searchParams, gameState.gameStatus]);
  
  // Fetch events from Supabase or use sample events
  const fetchEvents = useCallback(async (gameMode: 'daily' | 'friends' | 'single', count = DEFAULT_ROUNDS) => {
    try {
      let events: Event[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fetch events based on game mode
      if (gameMode === 'daily') {
        // For daily mode, fetch today's events
        const { data, error } = await supabase
          .from('daily_challenges')
          .select('*, event:historical_events(*)')
          .eq('challenge_date', today.toISOString().split('T')[0])
          .order('order', { ascending: true })
          .limit(count);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          events = data.map(item => item.event);
        } else {
          // If no daily challenge exists, create a fallback
          console.log('No daily challenge found for today');
          
          // Fetch random events instead
          const { data: randomEvents, error: randomError } = await supabase
            .from('historical_events')
            .select('*')
            .order('id', { ascending: false })
            .limit(count);
            
          if (randomError) throw randomError;
          
          if (randomEvents) {
            events = randomEvents;
          }
        }
      } else {
        // For single player or friends mode, fetch random events
        const { data, error } = await supabase
          .from('historical_events')
          .select('*')
          .order('id', { ascending: false })
          .limit(count);
          
        if (error) throw error;
        
        if (data) {
          events = data;
        }
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to sample events if needed
      return [];
    }
  }, []);
  
  const startGame = useCallback(async (settings: GameSettings) => {
    try {
      // Fetch events for the game
      const events = await fetchEvents(settings.gameMode, DEFAULT_ROUNDS);
      
      if (!events || events.length === 0) {
        toast({
          title: "Error",
          description: "Failed to load historical events. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Initialize game state
      setGameState(prev => ({
        ...prev,
        gameStatus: 'in-progress',
        events,
        currentRound: 1,
        totalRounds: events.length,
        currentEvent: events[0],
        selectedLocation: null,
        selectedYear: null,
        roundResults: [],
        settings,
        hintsUsed: { time: false, location: false },
        hintsAvailable: 2, // Reset hints for the first round
      }));
      
      // Update URL if needed
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('round', '1');
      window.history.replaceState({}, '', currentUrl.toString());
      
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive"
      });
    }
  }, [fetchEvents, toast]);
  
  // Handle location selection
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setGameState(prev => ({
      ...prev,
      selectedLocation: { lat, lng }
    }));
  }, []);
  
  // Handle year selection
  const handleYearSelect = useCallback((year: number) => {
    setGameState(prev => ({
      ...prev,
      selectedYear: year
    }));
  }, []);
  
  // Handle when time runs out
  const handleTimeUp = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== 'in-progress') return prev;
      
      // Auto-submit with the current selections
      submitGuess();
      
      return prev;
    });
  }, []);
  
  // Submit a guess for the current round
  const submitGuess = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== 'in-progress' || !prev.currentEvent || !prev.selectedLocation || !prev.selectedYear) {
        return prev;
      }
      
      // Calculate scores and distances
      const { location, year } = prev.currentEvent;
      const { lat, lng } = prev.selectedLocation;
      const eventLocation = { lat: location.lat, lng: location.lng };
      
      // Calculate distance between selected and actual location
      const distanceKm = calculateDistance(lat, lng, eventLocation.lat, eventLocation.lng);
      
      // Calculate year difference
      const yearDifference = Math.abs(prev.selectedYear - year);
      
      // Calculate scores
      const locationScore = calculateScore(distanceKm);
      const yearScore = calculateScore(yearDifference, true);
      
      // Determine time bonus if timer is enabled
      let timeBonus = 0;
      
      if (prev.settings.timerEnabled) {
        timeBonus = getTimeScore(prev.settings.timerDuration);
      }
      
      // Calculate total score for this round
      const totalScore = locationScore + yearScore + timeBonus;
      
      // Create round result
      const result: RoundResult = {
        event: prev.currentEvent,
        selectedLocation: prev.selectedLocation,
        selectedYear: prev.selectedYear,
        distanceKm,
        yearDifference,
        locationScore,
        yearScore,
        timeBonus,
        totalScore,
        hintsUsed: { ...prev.hintsUsed }
      };
      
      // Add to results array
      const newResults = [...prev.roundResults, result];
      
      return {
        ...prev,
        gameStatus: 'round-result',
        roundResults: newResults,
        hintsUsed: { time: false, location: false }, // Reset hints for the next round
        hintsAvailable: 2, // Reset available hints for the next round
      };
    });
    
    // Update URL
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('result', 'true');
    window.history.replaceState({}, '', currentUrl.toString());
  }, []);
  
  // Move to the next round
  const handleNextRound = useCallback(() => {
    setGameState(prev => {
      const nextRound = prev.currentRound + 1;
      
      // If all rounds complete, end the game
      if (nextRound > prev.totalRounds) {
        // Save game results for authenticated users
        if (user && prev.settings.gameMode !== 'friends') {
          saveGameResults(user.id, prev);
        }
        
        return {
          ...prev,
          gameStatus: 'game-over',
        };
      }
      
      // Otherwise, move to the next round
      return {
        ...prev,
        gameStatus: 'in-progress',
        currentRound: nextRound,
        currentEvent: prev.events[nextRound - 1],
        selectedLocation: null,
        selectedYear: null,
        hintsUsed: { time: false, location: false }, // Reset hints for the next round
        hintsAvailable: 2, // Reset available hints for the next round
      };
    });
    
    // Update URL
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('round', (gameState.currentRound + 1).toString());
    currentUrl.searchParams.delete('result');
    window.history.replaceState({}, '', currentUrl.toString());
  }, [user, gameState.currentRound]);
  
  // Handle time hint
  const handleTimeHint = useCallback(() => {
    setGameState(prev => {
      if (
        prev.gameStatus !== 'in-progress' || 
        !prev.currentEvent || 
        prev.hintsUsed.time || 
        prev.hintsAvailable <= 0
      ) {
        return prev;
      }
      
      const { year } = prev.currentEvent;
      const decade = Math.floor(year / 10) * 10;
      
      return {
        ...prev,
        hintsUsed: { ...prev.hintsUsed, time: true },
        hintsAvailable: prev.hintsAvailable - 1
      };
    });
  }, []);
  
  // Handle location hint
  const handleLocationHint = useCallback(() => {
    setGameState(prev => {
      if (
        prev.gameStatus !== 'in-progress' || 
        !prev.currentEvent || 
        prev.hintsUsed.location || 
        prev.hintsAvailable <= 0
      ) {
        return prev;
      }
      
      return {
        ...prev,
        hintsUsed: { ...prev.hintsUsed, location: true },
        hintsAvailable: prev.hintsAvailable - 1
      };
    });
  }, []);
  
  // Save game results to the database
  const saveGameResults = async (userId: string, state: GameState) => {
    try {
      // Calculate total score
      const totalScore = state.roundResults.reduce((sum, result) => sum + result.totalScore, 0);
      
      // Create game session record
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          creator_id: userId,
          game_mode: state.settings.gameMode,
          settings: state.settings,
          total_score: totalScore,
          completed: true
        })
        .select()
        .single();
      
      if (sessionError) throw sessionError;
      
      // Create individual result records
      const resultPromises = state.roundResults.map((result, index) => {
        return supabase
          .from('game_results')
          .insert({
            user_id: userId,
            game_session_id: sessionData.id,
            event_id: result.event.id,
            round_number: index + 1,
            selected_location: `POINT(${result.selectedLocation.lng} ${result.selectedLocation.lat})`,
            selected_year: result.selectedYear,
            distance_km: result.distanceKm,
            year_difference: result.yearDifference,
            location_score: result.locationScore,
            year_score: result.yearScore,
            time_bonus: result.timeBonus,
            total_score: result.totalScore,
            hints_used: Object.values(result.hintsUsed).filter(Boolean).length
          });
      });
      
      await Promise.all(resultPromises);
      
      console.log('Game results saved successfully');
    } catch (error) {
      console.error('Error saving game results:', error);
    }
  };
  
  const handleSettingsChange = useCallback((key: keyof GameSettings, value: any) => {
    setGameState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  }, []);
  
  // Calculate cumulative score
  const calculateCumulativeScore = useCallback(() => {
    return gameState.roundResults.reduce((sum, result) => sum + result.totalScore, 0);
  }, [gameState.roundResults]);
  
  // Helper function to calculate distance between two coordinates
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Implementation of Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  function toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
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
