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
import ViewToggle from '@/components/ViewToggle';
import HintSystem from '@/components/HintSystem';
import { sampleEvents } from '@/data/sampleEvents';
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
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Index = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmHomeOpen, setConfirmHomeOpen] = useState(false);
  const [activeView, setActiveView] = useState<'photo' | 'map'>('photo');
  const [gameState, setGameState] = useState<GameState>({
    settings: {
      distanceUnit: profile?.default_distance_unit || 'km',
      timerEnabled: false,
      timerDuration: 5,
      gameMode: 'daily',
      hintsEnabled: true,
      maxHints: 2
    },
    events: [],
    currentRound: 1,
    totalRounds: 5,
    roundResults: [],
    gameStatus: 'not-started',
    currentGuess: null,
    hints: {
      available: 2,
      timeHintUsed: false,
      locationHintUsed: false
    }
  });

  useEffect(() => {
    if (gameState.gameStatus === 'in-progress') {
      setActiveView('photo');
    }
  }, [gameState.currentRound, gameState.gameStatus]);

  useEffect(() => {
    if (gameState.gameStatus === 'in-progress') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('round', gameState.currentRound.toString());
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [gameState.currentRound, gameState.gameStatus]);

  useEffect(() => {
    if (gameState.gameStatus === 'in-progress') {
      const params = new URLSearchParams(location.search);
      const roundParam = params.get('round');
      if (roundParam) {
        const round = parseInt(roundParam);
        if (!isNaN(round) && round >= 1 && round <= gameState.totalRounds && round !== gameState.currentRound) {
          setGameState(prev => ({
            ...prev,
            currentRound: round,
            currentGuess: {
              location: null,
              year: 1962
            },
            timerStartTime: prev.settings.timerEnabled ? Date.now() : undefined,
            timerRemaining: prev.settings.timerEnabled ? prev.settings.timerDuration * 60 : undefined
          }));
        }
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (profile) {
      setGameState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          distanceUnit: profile.default_distance_unit || prev.settings.distanceUnit
        },
        userAvatar: profile.avatar_url
      }));
    }
  }, [profile]);

  const startGame = (settings: GameSettings) => {
    const shuffledEvents = shuffleArray(sampleEvents)
      .slice(0, 5)
      .map(event => ({
        ...event,
        gameMode: settings.gameMode
      }));
    
    setGameState({
      settings: {
        ...settings,
        distanceUnit: profile?.default_distance_unit || settings.distanceUnit
      },
      events: shuffledEvents,
      currentRound: 1,
      totalRounds: 5,
      roundResults: [],
      gameStatus: 'in-progress',
      currentGuess: {
        location: null,
        year: 1962
      },
      timerStartTime: settings.timerEnabled ? Date.now() : undefined,
      timerRemaining: settings.timerEnabled ? settings.timerDuration * 60 : undefined,
      userAvatar: profile?.avatar_url,
      hints: {
        available: settings.maxHints,
        timeHintUsed: false,
        locationHintUsed: false
      }
    });

    setActiveView('photo');

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('round', '1');
    window.history.replaceState({}, '', currentUrl.toString());
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    console.log("Location selected:", lat, lng);
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { year: 1962 }),
        location: { lat, lng }
      }
    }));
  };

  const handleYearSelect = (year: number) => {
    console.log("Year selected:", year);
    setGameState(prev => ({
      ...prev,
      currentGuess: {
        ...(prev.currentGuess || { location: null }),
        year
      }
    }));
  };

  const handleTimeUp = () => {
    console.log("Timer expired, submitting current guess");
    const currentEvent = gameState.events[gameState.currentRound - 1];
    const currentGuess = gameState.currentGuess || { location: null, year: 1962 };
    
    let result: RoundResult;
    
    if (currentGuess.location) {
      result = calculateRoundResult(currentEvent, currentGuess);
    } else {
      const yearError = Math.abs(currentEvent.year - currentGuess.year);
      result = {
        event: currentEvent,
        guess: currentGuess,
        distanceError: Infinity,
        yearError,
        locationScore: 0,
        timeScore: Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9)))),
        totalScore: 0
      };
      result.totalScore = result.locationScore + result.timeScore;
    }

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

  const submitGuess = () => {
    console.log("Submitting guess:", gameState.currentGuess);
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
        title: "No location selected",
        description: "You'll only receive points for your year guess.",
      });
      
      const currentEvent = gameState.events[gameState.currentRound - 1];
      const yearError = Math.abs(currentEvent.year - gameState.currentGuess.year);
      const timeScore = Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9))));
      
      const isPerfectTime = yearError === 0;
      
      const result: RoundResult = {
        event: currentEvent,
        guess: gameState.currentGuess,
        distanceError: Infinity,
        yearError,
        locationScore: 0,
        timeScore,
        totalScore: timeScore,
        hintsUsed: {
          time: gameState.hints.timeHintUsed,
          location: gameState.hints.locationHintUsed
        },
        achievements: {
          perfectTime: isPerfectTime
        }
      };

      setGameState(prev => ({
        ...prev,
        roundResults: [...prev.roundResults, result],
        gameStatus: 'round-result'
      }));
      
      return;
    }

    const currentEvent = gameState.events[gameState.currentRound - 1];
    const result = calculateRoundResult(currentEvent, gameState.currentGuess);
    
    result.hintsUsed = {
      time: gameState.hints.timeHintUsed,
      location: gameState.hints.locationHintUsed
    };

    setGameState(prev => ({
      ...prev,
      roundResults: [...prev.roundResults, result],
      gameStatus: 'round-result'
    }));
  };

  const handleNextRound = () => {
    if (gameState.currentRound === gameState.totalRounds) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'game-over'
      }));
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('round');
      window.history.replaceState({}, '', currentUrl.toString());
    } else {
      const nextRound = gameState.currentRound + 1;
      setGameState(prev => ({
        ...prev,
        currentRound: nextRound,
        gameStatus: 'in-progress',
        currentGuess: {
          location: null,
          year: 1962
        },
        timerStartTime: prev.settings.timerEnabled ? Date.now() : undefined,
        timerRemaining: prev.settings.timerEnabled ? prev.settings.timerDuration * 60 : undefined,
        hints: {
          available: prev.hints.available,
          timeHintUsed: false,
          locationHintUsed: false
        }
      }));
      
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('round', nextRound.toString());
      window.history.replaceState({}, '', currentUrl.toString());
    }
  };

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

  const calculateCumulativeScore = () => {
    return gameState.roundResults.reduce((sum, result) => sum + result.totalScore, 0);
  };

  const handleSettingsChange = (newSettings: GameSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: {
        ...newSettings,
        distanceUnit: profile?.default_distance_unit || newSettings.distanceUnit
      },
      timerRemaining: newSettings.timerEnabled 
        ? newSettings.timerDuration * 60 
        : undefined
    }));
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

  const handleViewChange = (view: 'photo' | 'map') => {
    setActiveView(view);
  };

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

  const renderGameView = () => {
    switch (gameState.gameStatus) {
      case 'not-started':
        return <HomeScreen onStartGame={startGame} />;
      
      case 'in-progress':
        const currentEvent = gameState.events[gameState.currentRound - 1];
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
              <div className="mb-4 mt-2">
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
                
                {gameState.settings.hintsEnabled && (
                  <HintSystem
                    onTimeHint={handleTimeHint}
                    onLocationHint={handleLocationHint}
                    timeHintUsed={gameState.hints.timeHintUsed}
                    locationHintUsed={gameState.hints.locationHintUsed}
                    hintsAvailable={gameState.hints.available}
                    timeHintRange={gameState.hints.timeHintRange}
                    locationHintRegion={gameState.hints.locationHintRegion}
                  />
                )}
                
                <div className="w-full">
                  <YearSlider 
                    value={gameState.currentGuess?.year || 1962}
                    onChange={handleYearSelect}
                    minYear={1900}
                    maxYear={new Date().getFullYear()}
                  />
                </div>
              </div>
              
              <ViewToggle 
                activeView={activeView}
                onViewChange={handleViewChange}
              />
              
              <div className="h-96 mb-6 relative z-30">
                {activeView === 'photo' ? (
                  <PhotoViewer src={currentEvent.imageUrl} alt="" />
                ) : (
                  <GameMap 
                    onLocationSelect={handleLocationSelect} 
                    selectedLocation={gameState.currentGuess?.location}
                    userAvatar={gameState.userAvatar}
                    locationHint={gameState.hints.locationHintRegion}
                  />
                )}
              </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-md border-t border-gray-200">
              <div className="container mx-auto p-4">
                <Button 
                  size="lg"
                  onClick={submitGuess}
                  disabled={!gameState.currentGuess?.year}
                  className="w-full"
                >
                  Submit Guess
                </Button>
              </div>
            </div>
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
