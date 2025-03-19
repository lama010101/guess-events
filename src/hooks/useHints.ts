
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
  
  // Fetch user's hint coins when component loads
  useEffect(() => {
    if (user) {
      fetchHintCoins();
    }
  }, [user]);
  
  // Fetch hint coins from database
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
  
  // Update hint coins in database
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
    // Check if hints are enabled in settings
    if (!gameState.settings.hintsEnabled) {
      toast({
        title: "Hints Disabled",
        description: "Hints are disabled in your game settings.",
        variant: "destructive"
      });
      return;
    }
    
    // If hint already used, just show it again
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
    
    // Check if user has enough hint coins
    if (hintCoins < 1 && user) {
      toast({
        title: "Not Enough Hint Coins",
        description: "You don't have enough hint coins. Visit your profile to get more.",
        variant: "destructive"
      });
      return;
    }
    
    // Use one of the available hints
    if (gameState.hints.available > 0 || !user) {
      const currentEvent = gameState.events[gameState.currentRound - 1];
      const yearStr = currentEvent.year.toString();
      const maskedYear = yearStr.slice(0, -1) + "X";
      
      // If user is logged in, deduct hint coin
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
    // Check if hints are enabled in settings
    if (!gameState.settings.hintsEnabled) {
      toast({
        title: "Hints Disabled",
        description: "Hints are disabled in your game settings.",
        variant: "destructive"
      });
      return;
    }
    
    // If hint already used, just show it again
    if (gameState.hints.locationHintUsed) {
      toast({
        title: "Location Hint",
        description: `The event occurred in ${gameState.hints.locationHintRegion?.country}.`,
      });
      return;
    }
    
    // Check if user has enough hint coins
    if (hintCoins < 1 && user) {
      toast({
        title: "Not Enough Hint Coins",
        description: "You don't have enough hint coins. Visit your profile to get more.",
        variant: "destructive"
      });
      return;
    }
    
    // Use one of the available hints
    if (gameState.hints.available > 0 || !user) {
      const currentEvent = gameState.events[gameState.currentRound - 1];
      
      // For this example, we'll just use the location name as the country
      // In a real implementation, you'd have a proper country field
      const country = currentEvent.location.name.split(',').pop()?.trim() || 'Unknown';
      
      // If user is logged in, deduct hint coin
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
            lng: currentEvent.location.lng
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
    
    // In a real implementation, you'd integrate an ad SDK here
    // For this example, we'll simulate watching an ad
    toast({
      title: "Ad Starting",
      description: "Simulating ad playback...",
    });
    
    // Simulate ad playback
    setTimeout(async () => {
      // Add 4 hint coins to the user's wallet
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
