
import { GameState } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

export const useHints = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const { toast } = useToast();
  
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
  
  return {
    handleTimeHint,
    handleLocationHint
  };
};

export default useHints;
