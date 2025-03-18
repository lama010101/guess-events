
import React, { useState, useEffect } from 'react';
import HomeScreen from '@/components/HomeScreen';
import GameResults from '@/components/GameResults';
import GameView from '@/components/GameView';
import SettingsDialog from '@/components/SettingsDialog';
import ConfirmHomeDialog from '@/components/ConfirmHomeDialog';
import GameContainer from '@/components/GameContainer';
import RoundResultView from '@/components/RoundResultView';
import useGameState from '@/hooks/useGameState';
import useGameActions from '@/hooks/useGameActions';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, profile } = useAuth();
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

  const {
    handleGoHome,
    confirmGoHome,
    handleRestart,
    handleReturnHome,
    handleShare
  } = useGameActions(gameState, setGameState, startGame);

  useEffect(() => {
    console.log("Game state changed:", gameState.gameStatus);
  }, [gameState.gameStatus]);

  const handleStartGameWithLog = (settings) => {
    console.log("Starting game with settings:", settings);
    startGame(settings);
  };

  const renderGameContent = () => {
    switch (gameState.gameStatus) {
      case 'not-started':
        return <HomeScreen onStartGame={handleStartGameWithLog} />;
      
      case 'in-progress':
        return (
          <GameContainer 
            gameState={gameState}
            onShare={handleShare}
            onSettingsClick={() => {}} // Passing empty function for compatibility
            onHomeClick={() => handleGoHome(setConfirmHomeOpen)}
            cumulativeScore={calculateCumulativeScore()}
          >
            <GameView 
              gameState={gameState}
              onLocationSelect={handleLocationSelect}
              onYearSelect={handleYearSelect}
              onTimeUp={handleTimeUp}
              onSubmitGuess={submitGuess}
              onTimeHint={handleTimeHint}
              onLocationHint={handleLocationHint}
            />
          </GameContainer>
        );
      
      case 'round-result':
        const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
        return (
          <GameContainer 
            gameState={gameState}
            onShare={handleShare}
            onSettingsClick={() => {}} // Passing empty function for compatibility
            onHomeClick={() => handleGoHome(setConfirmHomeOpen)}
            cumulativeScore={calculateCumulativeScore()}
          >
            <RoundResultView 
              result={lastResult}
              gameState={gameState}
              onNextRound={handleNextRound}
            />
          </GameContainer>
        );
      
      case 'game-over':
        return (
          <GameContainer 
            gameState={gameState}
            onShare={handleShare}
            onSettingsClick={() => {}} // Passing empty function for compatibility
            onHomeClick={() => handleGoHome(setConfirmHomeOpen)}
            cumulativeScore={calculateCumulativeScore()}
          >
            <GameResults 
              results={gameState.roundResults} 
              onRestart={handleRestart}
              onHome={handleReturnHome}
            />
          </GameContainer>
        );
      
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <>
      {renderGameContent()}
      
      <SettingsDialog 
        open={settingsOpen}
        settings={gameState.settings}
        onOpenChange={setSettingsOpen}
        onSettingsChange={handleSettingsChange}
      />

      <ConfirmHomeDialog
        open={confirmHomeOpen}
        onOpenChange={setConfirmHomeOpen}
        onConfirm={confirmGoHome}
      />
    </>
  );
};

export default Index;
