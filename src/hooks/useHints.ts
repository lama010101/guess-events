import { GameState } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

export const useHints = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const { toast } = useToast();
  
  const handleTimeHint = () => {
    // Check if hints are enabled in settings
    if (!gameState.settings.hintsEnabled) {
      toast({
        title: "Hints Disabled",
        description: "Hints are disabled in your game settings.",
        variant: "destructive"
      });
      return;
    }
    
    const currentEvent = gameState.events[gameState.currentRound - 1];
    const year = currentEvent.year;
    const range = 60; // 60-year range initially (will be halved)
    const min = Math.max(1900, year - range / 2);
    const max = Math.min(new Date().getFullYear(), year + range / 2);
    
    // If hint already used, just show it again
    if (gameState.hints.timeHintUsed) {
      toast({
        title: "Time Hint",
        description: `The event occurred between ${gameState.hints.timeHintRange?.min} and ${gameState.hints.timeHintRange?.max}.`,
      });
      return;
    }
    
    // Otherwise use one of the available hints
    if (gameState.hints.available > 0) {
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
    } else {
      toast({
        title: "No Hints Left",
        description: "You've used all your available hints for this round.",
        variant: "destructive"
      });
    }
  };
  
  const handleLocationHint = () => {
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
        description: "A highlighted region has been added to the map.",
      });
      return;
    }
    
    // Otherwise use one of the available hints
    if (gameState.hints.available > 0) {
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
    } else {
      toast({
        title: "No Hints Left",
        description: "You've used all your available hints for this round.",
        variant: "destructive"
      });
    }
  };
  
  return {
    handleTimeHint,
    handleLocationHint
  };
};

export default useHints;
