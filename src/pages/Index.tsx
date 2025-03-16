
import React, { useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import RoundResultComponent from '@/components/RoundResult';
import GameResults from '@/components/GameResults';
import GameHeader from '@/components/GameHeader';
import SettingsDialog from '@/components/SettingsDialog';
import GameView from '@/components/GameView';
import useGameState from '@/hooks/useGameState';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
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
  
  const {
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
  } = useGameState();

  const handleGoHome = () => {
    setConfirmHomeOpen(true);
  };

  const confirmGoHome = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'not-started'
    }));
    setConfirmHomeOpen(false);
    
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

  const renderGameView = () => {
    switch (gameState.gameStatus) {
      case 'not-started':
        return <HomeScreen onStartGame={startGame} />;
      
      case 'in-progress':
        return (
          <div className="container mx-auto min-h-screen bg-[#f3f3f3]">
            <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
              <div className="container mx-auto p-4">
                <GameHeader 
                  currentRound={gameState.currentRound} 
                  totalRounds={gameState.totalRounds}
                  cumulativeScore={calculateCumulativeScore()}
                  onShare={handleShare}
                  onSettingsClick={() => setSettingsOpen(true)}
                  onHomeClick={handleGoHome}
                />
              </div>
            </div>
            
            <GameView 
              gameState={gameState}
              onLocationSelect={handleLocationSelect}
              onYearSelect={handleYearSelect}
              onTimeUp={handleTimeUp}
              onSubmitGuess={submitGuess}
              onTimeHint={handleTimeHint}
              onLocationHint={handleLocationHint}
            />
          </div>
        );
      
      case 'round-result':
        const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
        return (
          <div className="container mx-auto min-h-screen bg-[#f3f3f3]">
            <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
              <div className="container mx-auto p-4">
                <GameHeader 
                  currentRound={gameState.currentRound} 
                  totalRounds={gameState.totalRounds}
                  cumulativeScore={calculateCumulativeScore()}
                  onShare={handleShare}
                  onSettingsClick={() => setSettingsOpen(true)}
                  onHomeClick={handleGoHome}
                />
              </div>
            </div>
            
            <div className="pt-20 pb-24">
              <RoundResultComponent 
                result={lastResult} 
                onNextRound={handleNextRound} 
                distanceUnit={gameState.settings.distanceUnit}
                isLastRound={gameState.currentRound === gameState.totalRounds}
                userAvatar={gameState.userAvatar}
              />
            </div>
          </div>
        );
      
      case 'game-over':
        return (
          <div className="container mx-auto p-4 min-h-screen bg-[#f3f3f3]">
            <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
              <div className="container mx-auto p-4">
                <GameHeader 
                  currentRound={gameState.currentRound} 
                  totalRounds={gameState.totalRounds}
                  cumulativeScore={calculateCumulativeScore()}
                  onShare={handleShare}
                  onSettingsClick={() => setSettingsOpen(true)}
                  onHomeClick={handleGoHome}
                />
              </div>
            </div>
            
            <div className="pt-20">
              <GameResults 
                results={gameState.roundResults} 
                onRestart={handleRestart}
                onHome={handleReturnHome}
              />
            </div>
          </div>
        );
      
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <>
      {renderGameView()}
      
      <SettingsDialog 
        open={settingsOpen}
        settings={gameState.settings}
        onOpenChange={setSettingsOpen}
        onSettingsChange={handleSettingsChange}
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
    </>
  );
};

export default Index;
