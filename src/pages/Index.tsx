
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import HomeScreen from '@/components/HomeScreen';
import PhotoViewer from '@/components/PhotoViewer';
import GameMap from '@/components/GameMap';
import YearSlider from '@/components/YearSlider';
import GameHeader from '@/components/GameHeader';
import RoundResultComponent from '@/components/RoundResult';
import GameResults from '@/components/GameResults';
import SettingsDialog from '@/components/SettingsDialog';
import Timer from '@/components/Timer';
import { sampleEvents } from '@/data/sampleEvents';
import { 
  GameSettings, 
  GameState, 
  PlayerGuess, 
  HistoricalEvent,
  RoundResult 
} from '@/types/game';
import { 
  calculateRoundResult, 
  shuffleArray 
} from '@/utils/gameUtils';

const Index = () => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    settings: {
      distanceUnit: 'km',
      timerEnabled: false,
      timerDuration: 5
    },
    events: [],
    currentRound: 1,
    totalRounds: 5,
    roundResults: [],
    gameStatus: 'not-started',
    currentGuess: null
  });

  // Initialize a new game with the given settings
  const startGame = (settings: GameSettings) => {
    // Get 5 random events from the sample data
    const shuffledEvents = shuffleArray(sampleEvents).slice(0, 5);
    
    setGameState({
      settings,
      events: shuffledEvents,
      currentRound: 1,
      totalRounds: 5,
      roundResults: [],
      gameStatus: 'in-progress',
      currentGuess: {
        location: null,
        year: 1960 // Default year is now 1960
      },
      timerStartTime: settings.timerEnabled ? Date.now() : undefined,
      timerRemaining: settings.timerEnabled ? settings.timerDuration * 60 : undefined
    });
  };

  // Handle location selection on the map
  const handleLocationSelect = (lat: number, lng: number) => {
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { year: 1960 }),
        location: { lat, lng }
      }
    }));
  };

  // Handle year selection from the slider
  const handleYearSelect = (year: number) => {
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { location: null }),
        year
      }
    }));
  };

  // Handle timer expiration
  const handleTimeUp = () => {
    const currentEvent = gameState.events[gameState.currentRound - 1];
    const result = calculateRoundResult(
      currentEvent, 
      gameState.currentGuess || { location: null, year: 1960 }
    );

    setGameState(prev => ({
      ...prev,
      roundResults: [...prev.roundResults, result],
      gameStatus: 'round-result'
    }));

    toast({
      title: "Time's up!",
      description: "Your guess has been submitted automatically.",
    });
  };

  // Submit the current guess and show results
  const submitGuess = () => {
    if (!gameState.currentGuess) {
      toast({
        title: "Missing guess",
        description: "Please select both a location and a year.",
        variant: "destructive"
      });
      return;
    }

    if (!gameState.currentGuess.location) {
      toast({
        title: "Missing location",
        description: "Please select a location on the map.",
        variant: "destructive"
      });
      return;
    }

    const currentEvent = gameState.events[gameState.currentRound - 1];
    const result = calculateRoundResult(currentEvent, gameState.currentGuess);

    setGameState(prev => ({
      ...prev,
      roundResults: [...prev.roundResults, result],
      gameStatus: 'round-result'
    }));
  };

  // Progress to the next round or end the game
  const handleNextRound = () => {
    if (gameState.currentRound === gameState.totalRounds) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'game-over'
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        currentRound: prev.currentRound + 1,
        gameStatus: 'in-progress',
        currentGuess: {
          location: null,
          year: 1960 // Default year for each new round
        },
        timerStartTime: prev.settings.timerEnabled ? Date.now() : undefined,
        timerRemaining: prev.settings.timerEnabled ? prev.settings.timerDuration * 60 : undefined
      }));
    }
  };

  // Restart the game with the same settings
  const handleRestart = () => {
    startGame(gameState.settings);
  };

  // Return to the home screen
  const handleReturnHome = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'not-started'
    }));
  };

  // Calculate the cumulative score
  const calculateCumulativeScore = () => {
    return gameState.roundResults.reduce((sum, result) => sum + result.totalScore, 0);
  };

  // Handle settings changes
  const handleSettingsChange = (newSettings: GameSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: newSettings,
      timerRemaining: newSettings.timerEnabled 
        ? newSettings.timerDuration * 60 
        : undefined
    }));
  };

  // Handle share button click
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

  // Render the current game view based on game status
  const renderGameView = () => {
    switch (gameState.gameStatus) {
      case 'not-started':
        return <HomeScreen onStartGame={startGame} />;
      
      case 'in-progress':
        const currentEvent = gameState.events[gameState.currentRound - 1];
        return (
          <div className="container mx-auto p-4 min-h-screen">
            <GameHeader 
              currentRound={gameState.currentRound} 
              totalRounds={gameState.totalRounds}
              cumulativeScore={calculateCumulativeScore()}
              onShare={handleShare}
              onSettingsClick={() => setSettingsOpen(true)}
            />
            
            {gameState.settings.timerEnabled && (
              <div className="mb-4">
                <Timer 
                  durationMinutes={gameState.settings.timerDuration}
                  onTimeUp={handleTimeUp}
                  isActive={gameState.gameStatus === 'in-progress'}
                  remainingSeconds={gameState.timerRemaining}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="h-96">
                <PhotoViewer src={currentEvent.imageUrl} />
              </div>
              <div className="h-96">
                <GameMap 
                  onLocationSelect={handleLocationSelect} 
                  selectedLocation={gameState.currentGuess?.location}
                />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
              <div className="w-full md:w-auto">
                <YearSlider 
                  value={gameState.currentGuess?.year || 1960}
                  onChange={handleYearSelect} 
                />
              </div>
              <Button 
                size="lg"
                onClick={submitGuess}
                disabled={!gameState.currentGuess?.location}
              >
                Submit Guess
              </Button>
            </div>
          </div>
        );
      
      case 'round-result':
        const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
        return (
          <div className="container mx-auto p-4 min-h-screen">
            <RoundResultComponent 
              result={lastResult} 
              onNextRound={handleNextRound} 
              distanceUnit={gameState.settings.distanceUnit}
              isLastRound={gameState.currentRound === gameState.totalRounds}
            />
          </div>
        );
      
      case 'game-over':
        return (
          <div className="container mx-auto p-4 min-h-screen">
            <GameResults 
              results={gameState.roundResults} 
              onRestart={handleRestart}
              onHome={handleReturnHome}
            />
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
    </>
  );
};

export default Index;
