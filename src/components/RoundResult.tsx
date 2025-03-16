
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Map, Trophy, Maximize, Minimize } from 'lucide-react';
import { RoundResult } from '@/types/game';
import GameMap from './GameMap';
import PhotoViewer from './PhotoViewer';

interface RoundResultComponentProps {
  result: RoundResult;
  onNextRound: () => void;
  distanceUnit: 'km' | 'miles';
  isLastRound: boolean;
  userAvatar: string | null;
}

const RoundResultComponent: React.FC<RoundResultComponentProps> = ({
  result,
  onNextRound,
  distanceUnit,
  isLastRound,
  userAvatar
}) => {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Format distance based on chosen unit
  const formatDistance = (distanceKm: number): string => {
    if (distanceUnit === 'miles') {
      const miles = distanceKm * 0.621371;
      return miles < 1 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`;
    }
    
    return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
  };
  
  // Determine achievements (if any)
  const achievements: string[] = [];
  
  if (result.distanceKm < 10) {
    achievements.push("Bullseye! You pinpointed the location!");
  }
  
  if (result.yearDifference === 0) {
    achievements.push("Time Lord! You got the exact year!");
  }
  
  if (result.totalScore >= 950) {
    achievements.push("Perfect Historian! Nearly perfect score!");
  }
  
  if (!result.hintsUsed.location && !result.hintsUsed.time && result.totalScore > 800) {
    achievements.push("No Help Needed! Great score without hints!");
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Round {result.event.round_number || '?'} Results</span>
            {result.totalScore >= 800 && (
              <Trophy className="text-yellow-500 h-6 w-6" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{result.event.title || 'Historical Event'}</h3>
              <p className="text-muted-foreground mb-4">{result.event.description}</p>
              
              <div className="rounded-lg overflow-hidden mb-4">
                <PhotoViewer 
                  image={result.event.image_url} 
                  description={`${result.event.year}: ${result.event.description}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Correct Year:</span>
                  <span>{result.event.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Your Guess:</span>
                  <span>{result.selectedYear}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Difference:</span>
                  <span className={result.yearDifference === 0 ? 'text-green-600 font-bold' : ''}>
                    {result.yearDifference} years
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Year Score:</span>
                  <span>{result.yearScore} points</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="relative rounded-lg overflow-hidden mb-4 border" style={{ height: isMapExpanded ? '400px' : '240px' }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2 z-10"
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                >
                  {isMapExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                
                <GameMap 
                  selectedLocation={result.selectedLocation}
                  actualLocation={{
                    lat: result.event.location.lat,
                    lng: result.event.location.lng
                  }}
                  isStatic={!isMapExpanded}
                  showUserAvatar={!!userAvatar}
                  userAvatar={userAvatar}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Distance:</span>
                  <span className={result.distanceKm < 50 ? 'text-green-600 font-bold' : ''}>
                    {formatDistance(result.distanceKm)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Location Score:</span>
                  <span>{result.locationScore} points</span>
                </div>
                {result.timeBonus > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Time Bonus:</span>
                    <span className="text-blue-600">+{result.timeBonus} points</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium text-lg">Total Score:</span>
                  <span className="text-lg font-bold">{result.totalScore} points</span>
                </div>
              </div>
            </div>
          </div>
          
          {achievements.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <Trophy className="text-amber-500 h-5 w-5" />
                Achievements
              </h3>
              <ul className="space-y-2">
                {achievements.map((achievement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="text-green-500 h-4 w-4" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-center pt-4">
            <Button onClick={onNextRound} className="w-full md:w-auto">
              {isLastRound ? 'View Final Results' : 'Next Round'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoundResultComponent;
