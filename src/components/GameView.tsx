
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Map } from 'lucide-react';
import PhotoViewer from './PhotoViewer';
import GameMap from './GameMap';
import YearSlider from './YearSlider';
import Timer from './Timer';
import HintSystem from './HintSystem';
import ViewToggle from './ViewToggle';
import { GameState, RoundResult } from '@/types/game';

interface GameViewProps {
  gameState: GameState;
  onLocationSelect: (lat: number, lng: number) => void;
  onYearSelect: (year: number) => void;
  onTimeUp: () => void;
  onSubmitGuess: () => void;
  onTimeHint: () => void;
  onLocationHint: () => void;
}

const GameView: React.FC<GameViewProps> = ({
  gameState,
  onLocationSelect,
  onYearSelect,
  onTimeUp,
  onSubmitGuess,
  onTimeHint,
  onLocationHint
}) => {
  const [view, setView] = useState<'photo' | 'map'>('photo');
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  
  const canSubmit = gameState.selectedLocation !== null && gameState.selectedYear !== null;
  
  // Make sure we have an event
  if (!gameState.currentEvent) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="relative pt-24 pb-20 min-h-screen">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <Card className="w-full bg-white rounded-lg overflow-hidden border">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center">
              <ViewToggle 
                view={view} 
                onChange={(v) => setView(v)} 
              />
            </div>
            <div className="flex items-center space-x-3">
              {gameState.settings.timerEnabled && (
                <Timer 
                  duration={gameState.settings.timerDuration * 60}
                  onTimeUp={onTimeUp}
                  round={gameState.currentRound}
                />
              )}
              <HintSystem 
                hintsUsed={gameState.hintsUsed}
                hintsAvailable={gameState.hintsAvailable}
                onTimeHint={onTimeHint}
                onLocationHint={onLocationHint}
                disabled={gameState.gameStatus !== 'in-progress'}
              />
            </div>
          </div>
          
          <div style={{ minHeight: "50vh" }}>
            {view === 'photo' ? (
              <PhotoViewer 
                image={gameState.currentEvent.image_url} 
                description=""
                hint={gameState.hintsUsed.time ? 
                  `Decade: ${Math.floor(gameState.currentEvent.year / 10) * 10}s` : 
                  undefined}
              />
            ) : (
              <GameMap 
                onLocationSelect={onLocationSelect}
                selectedLocation={gameState.selectedLocation}
                actualLocation={null}
                regionHint={gameState.hintsUsed.location ? gameState.currentEvent.location.country : undefined}
                isFullscreen={isFullscreenMap}
                onToggleFullscreen={() => setIsFullscreenMap(!isFullscreenMap)}
                showUserAvatar={!!gameState.userAvatar}
                userAvatar={gameState.userAvatar}
              />
            )}
          </div>
          
          <div className="p-4 border-t">
            <YearSlider
              onYearSelect={onYearSelect}
              selectedYear={gameState.selectedYear}
              min={1800}
              max={2023}
              step={1}
              disabled={gameState.gameStatus !== 'in-progress'}
            />
          </div>
        </Card>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setView('photo')}
              className={`${view === 'photo' ? 'bg-primary/10' : ''}`}
            >
              <Image className="h-4 w-4 mr-2" />
              Photo
            </Button>
            <Button
              variant="outline"
              onClick={() => setView('map')}
              className={`${view === 'map' ? 'bg-primary/10' : ''}`}
            >
              <Map className="h-4 w-4 mr-2" />
              Map
            </Button>
          </div>
          
          <Button
            onClick={onSubmitGuess}
            disabled={!canSubmit || gameState.gameStatus !== 'in-progress'}
            className="w-32"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameView;
