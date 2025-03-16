import React, { useState, useEffect, useCallback } from 'react';
import { PhotoViewer } from './PhotoViewer';
import { GameMap } from './GameMap';
import { Button } from "@/components/ui/button";
import { ViewToggle } from './ViewToggle';
import { GameHeader } from './GameHeader';
import { GameResults } from './GameResults';
import { useGameState } from '@/hooks/useGameState';
import { calculateTotalScore } from '@/utils/gameUtils';

const GameView = () => {
  const {
    currentRound,
    totalRounds,
    gameMode,
    selectedYear,
    selectedLocation,
    view,
    setView,
    handleYearSelect,
    handleMapClick,
    handleSubmitGuess,
    showResult,
    roundResult,
    gameStatus,
    resetGame,
    events,
    currentEvent,
    distanceUnit,
    timerEnabled,
    timerDuration,
    handleTimerEnd,
    hints,
    useHint,
    achievements,
    userAvatar
  } = useGameState();
  
  return (
    <div className="relative flex flex-col h-full">
      {/* Game header with year selector and timer */}
      <div className="p-4 border-b z-10">
        <GameHeader
          currentRound={currentRound}
          totalRounds={totalRounds}
          gameMode={gameMode}
          onSelectYear={handleYearSelect}
          year={selectedYear}
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
                  src={currentEvent?.image_url || ''}
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
                      ? { lat: currentEvent?.latitude, lng: currentEvent?.longitude }
                      : undefined
                  }
                  distanceUnit={distanceUnit}
                  showDistance={showResult}
                  userAvatar={userAvatar} // Pass user avatar for the pin
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Game controls footer - ensure always visible */}
      <div className="p-4 border-t bg-background z-10">
        <div className="flex justify-between items-center">
          <div>
            {showResult && roundResult && (
              <div className="text-sm">
                <span className="font-medium">Distance: </span>
                <span>{roundResult.distance} {distanceUnit}</span>
                {roundResult.yearError !== 0 && (
                  <span className="ml-2 font-medium">Year Error: </span>
                )}
                {roundResult.yearError !== 0 && (
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
          achievements={achievements} // Pass achievements to display them
        />
      )}
    </div>
  );
};

export default GameView;
