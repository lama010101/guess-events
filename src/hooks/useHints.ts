import { useState, useEffect } from 'react';
import { GameState } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useHints = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [hintCoins, setHintCoins] = useState<number>(10);
  
  useEffect(() => {
    if (user) {
      fetchHintCoins();
    }
  }, [user]);
  
  const fetchHintCoins = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hints_wallet')
        .select('hint_coins')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setHintCoins(data.hint_coins);
      }
    } catch (error) {
      console.error('Error fetching hint coins:', error);
    }
  };
  
  const updateHintCoins = async (newCoins: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('hints_wallet')
        .update({ hint_coins: newCoins })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setHintCoins(newCoins);
    } catch (error) {
      console.error('Error updating hint coins:', error);
    }
  };
  
  const handleTimeHint = async () => {
    if (!gameState.settings.hintsEnabled) {
      toast({
        title: "Hints Disabled",
        description: "Hints are disabled in your game settings.",
        variant: "destructive"
      });
      return;
    }
    
    if (gameState.hints.timeHintUsed) {
      const currentEvent = gameState.events[gameState.currentRound - 1];
      const yearStr = currentEvent.year.toString();
      const maskedYear = yearStr.slice(0, -1) + "X";
      
      toast({
        title: "Time Hint",
        description: `The event occurred around ${maskedYear}.`,
      });
      return;
    }
    
    if (hintCoins < 1 && user) {
      toast({
        title: "Not Enough Hint Coins",
        description: "You don't have enough hint coins. Visit your profile to get more.",
        variant: "destructive"
      });
      return;
    }
    
    if (gameState.hints.available > 0 || !user) {
      const currentEvent = gameState.events[gameState.currentRound - 1];
      const yearStr = currentEvent.year.toString();
      const maskedYear = yearStr.slice(0, -1) + "X";
      
      if (user) {
        await updateHintCoins(hintCoins - 1);
      }
      
      setGameState(prev => ({
        ...prev,
        hints: {
          ...prev.hints,
          available: prev.hints.available - 1,
          timeHintUsed: true,
          timeHintRange: { maskedYear }
        }
      }));
      
      toast({
        title: "Time Hint Used",
        description: `The event occurred around ${maskedYear}.`,
      });
    } else {
      toast({
        title: "No Hints Left",
        description: "You've used all your available hints for this round.",
        variant: "destructive"
      });
    }
  };
  
  const handleLocationHint = async () => {
    if (!gameState.settings.hintsEnabled) {
      toast({
        title: "Hints Disabled",
        description: "Hints are disabled in your game settings.",
        variant: "destructive"
      });
      return;
    }
    
    if (gameState.hints.locationHintUsed) {
      toast({
        title: "Location Hint",
        description: `The event occurred in ${gameState.hints.locationHintRegion?.country}.`,
      });
      return;
    }
    
    if (hintCoins < 1 && user) {
      toast({
        title: "Not Enough Hint Coins",
        description: "You don't have enough hint coins. Visit your profile to get more.",
        variant: "destructive"
      });
      return;
    }
    
    if (gameState.hints.available > 0 || !user) {
      const currentEvent = gameState.events[gameState.currentRound - 1];
      
      const country = currentEvent.location.name.split(',').pop()?.trim() || 'Unknown';
      
      if (user) {
        await updateHintCoins(hintCoins - 1);
      }
      
      setGameState(prev => ({
        ...prev,
        hints: {
          ...prev.hints,
          available: prev.hints.available - 1,
          locationHintUsed: true,
          locationHintRegion: {
            country,
            lat: currentEvent.location.lat,
            lng: currentEvent.location.lng,
            radiusKm: 300
          }
        }
      }));
      
      toast({
        title: "Location Hint Used",
        description: `The event occurred in ${country}.`,
      });
    } else {
      toast({
        title: "No Hints Left",
        description: "You've used all your available hints for this round.",
        variant: "destructive"
      });
    }
  };
  
  const watchAdForHints = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to watch ads for hint coins.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Ad Starting",
      description: "Simulating ad playback...",
    });
    
    setTimeout(async () => {
      const newCoins = hintCoins + 4;
      await updateHintCoins(newCoins);
      
      toast({
        title: "Ad Completed",
        description: "You earned 4 hint coins!",
      });
    }, 2000);
  };
  
  return {
    handleTimeHint,
    handleLocationHint,
    watchAdForHints,
    hintCoins
  };
};

export default useHints;
