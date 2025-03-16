
import React, { useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import RoundResultComponent from '@/components/RoundResult';
import GameResults from '@/components/GameResults';
import GameHeader from '@/components/GameHeader';
import SettingsDialog from '@/components/SettingsDialog';
import GameView from '@/components/GameView';
import { useGameState } from '@/hooks/useGameState';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { GameSettings } from '@/types/game';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmHomeOpen, setConfirmHomeOpen] = useState(false);
  
  // We're using a placeholder until we refactor this component
  // to work with the updated useGameState hook
  const gameState = {
    gameStatus: 'not-started',
    settings: {
      distanceUnit: 'km' as 'km' | 'miles',
      timerEnabled: true,
      timerDuration: 5,
      gameMode: 'single' as 'daily' | 'friends' | 'single',
      hintsEnabled: true,
      maxHints: 2
    } as GameSettings,
    currentRound: 1,
    totalRounds: 5
  };

  const handleGoHome = () => {
    setConfirmHomeOpen(true);
  };

  const confirmGoHome = () => {
    setConfirmHomeOpen(false);
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('round');
    window.history.replaceState({}, '', currentUrl.toString());
  };

  const handleRestart = () => {
    // Placeholder
  };

  const handleReturnHome = () => {
    // Placeholder
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

  const renderGameView = () => {
    return <GameView />;
  };

  return (
    <div className="min-h-screen flex flex-col h-full">
      {renderGameView()}
      
      <SettingsDialog 
        open={settingsOpen}
        settings={gameState.settings}
        onOpenChange={setSettingsOpen}
        onSettingsChange={() => {}}
      />

      <AlertDialog open={confirmHomeOpen} onOpenChange={setConfirmHomeOpen}>
        <AlertDialogContent className="z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle>Return to Home Screen?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current game will be canceled and your progress will be lost. 
              Are you sure you want to go back to the home screen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGoHome}>
              Yes, go to Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
