
import React from 'react';
import PhotoViewer from './PhotoViewer';
import GameMap from './GameMap';
import { Button } from "@/components/ui/button";
import ViewToggle from './ViewToggle';
import GameHeader from './GameHeader';
import GameResults from './GameResults';
import { useGameState } from '@/hooks/useGameState';
import { calculateTotalScore } from '@/utils/gameUtils';

// Define a proper interface for the component props
interface GameViewProps {
  // Add any props needed for the GameView component
}

const GameView: React.FC<GameViewProps> = () => {
  const {
    gameState,
    view,
    setView,
    handleMapClick,
    handleYearSelect,
    handleSubmitGuess,
    resetGame,
    useHint,
    roundResult,
    achievements,
    distanceUnit,
    userAvatar
  } = useGameState();

  const {
    currentRound,
    totalRounds,
    gameStatus,
    settings,
    hints,
    roundResults,
    events,
    currentEvent,
    currentGuess
  } = gameState;

  const selectedLocation = currentGuess?.location || null;
  const selectedYear = currentGuess?.year || null;
  const gameMode = settings.gameMode;
  const timerEnabled = settings.timerEnabled;
  const timerDuration = settings.timerDuration;
  const showResult = gameStatus === 'show-result' || gameStatus === 'round-result';

  const handleTimerEnd = () => {
    console.log("Timer ended");
    // Implement timer end logic if needed
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Game header with year selector and timer */}
      <div className="px-4 py-2 border-b z-10">
        <GameHeader
          currentRound={currentRound}
          totalRounds={totalRounds}
          cumulativeScore={calculateTotalScore(roundResults)}
          year={selectedYear || undefined}
          onSelectYear={handleYearSelect}
          timerEnabled={timerEnabled}
          timerDuration={timerDuration}
          onTimerEnd={handleTimerEnd}
          isTimerRunning={gameStatus === 'in-progress'}
          hints={hints}
          onUseHint={useHint}
          currentEvent={currentEvent}
        />
      </div>
      
      {/* Main game area with map and photo */}
      <div className="flex-grow relative overflow-hidden">
        <div className="h-full flex flex-col">
          {/* View toggle buttons - positioned to not be hidden by topbar */}
          <div className="absolute top-4 right-4 z-10">
            <ViewToggle view={view} onChange={setView} />
          </div>
          
          {/* Main view area */}
          <div className="flex-grow relative">
            {view === 'photo' && (
              <div className="h-full w-full flex items-center justify-center">
                <PhotoViewer
                  src={currentEvent?.image_url || currentEvent?.imageUrl || ''}
                  alt={currentEvent?.description || 'Historical event'}
                />
              </div>
            )}
            
            {view === 'map' && (
              <div className="h-full w-full">
                <GameMap
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleMapClick}
                  actualLocation={
                    showResult
                      ? { 
                          lat: currentEvent?.latitude || currentEvent?.location?.lat || 0, 
                          lng: currentEvent?.longitude || currentEvent?.location?.lng || 0 
                        }
                      : undefined
                  }
                  distanceUnit={distanceUnit}
                  showDistance={showResult}
                  userAvatar={userAvatar}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Game controls footer - make more compact */}
      <div className="py-2 px-4 border-t bg-background z-10">
        <div className="flex justify-between items-center">
          <div>
            {showResult && roundResult && (
              <div className="text-sm">
                <span className="font-medium">Distance: </span>
                <span>{roundResult.distanceError} {distanceUnit}</span>
                {(roundResult.yearError !== 0 && roundResult.yearError !== undefined) && (
                  <span className="ml-2 font-medium">Year Error: </span>
                )}
                {(roundResult.yearError !== 0 && roundResult.yearError !== undefined) && (
                  <span>{Math.abs(roundResult.yearError)} years</span>
                )}
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSubmitGuess}
            disabled={!selectedLocation || !selectedYear || showResult}
            className="min-w-[120px]"
          >
            {showResult ? (currentRound < totalRounds ? 'Next Round' : 'View Results') : 'Submit'}
          </Button>
        </div>
      </div>
      
      {/* Results overlay */}
      {gameStatus === 'completed' && (
        <GameResults
          results={roundResults}
          totalScore={calculateTotalScore(roundResults)}
          onPlayAgain={resetGame}
          distanceUnit={distanceUnit}
          gameMode={gameMode}
          achievements={achievements}
        />
      )}
    </div>
  );
};

export default GameView;
