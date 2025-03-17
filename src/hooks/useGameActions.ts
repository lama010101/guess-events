
import { GameState, GameSettings } from '@/types/game';
import { useToast } from "@/hooks/use-toast";

export const useGameActions = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  startGame: (settings: GameSettings) => void
) => {
  const { toast } = useToast();

  const handleGoHome = (setConfirmHomeOpen: (open: boolean) => void) => {
    setConfirmHomeOpen(true);
  };

  const confirmGoHome = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'not-started'
    }));
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('round');
    window.history.replaceState({}, '', currentUrl.toString());
  };

  const handleRestart = () => {
    startGame(gameState.settings);
  };

  const handleReturnHome = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'not-started'
    }));
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('round');
    window.history.replaceState({}, '', currentUrl.toString());
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "Share this link with friends to challenge them.",
        });
      })
      .catch(err => {
        toast({
          title: "Failed to copy link",
          description: "Please try again or share the URL manually.",
          variant: "destructive",
        });
      });
  };

  return {
    handleGoHome,
    confirmGoHome,
    handleRestart,
    handleReturnHome,
    handleShare
  };
};

export default useGameActions;
