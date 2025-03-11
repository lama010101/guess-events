
import React from 'react';
import { RoundResult } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, convertToMiles } from '@/utils/gameUtils';
import GameMap from './GameMap';
import PhotoViewer from './PhotoViewer';

interface RoundResultProps {
  result: RoundResult;
  onNextRound: () => void;
  distanceUnit: 'km' | 'miles';
  isLastRound: boolean;
  userAvatar?: string | null;
}

const RoundResultComponent: React.FC<RoundResultProps> = ({ 
  result, 
  onNextRound, 
  distanceUnit,
  isLastRound,
  userAvatar = null
}) => {
  const { event, guess, distanceError, yearError, locationScore, timeScore, totalScore } = result;
  
  const formattedDistance = distanceUnit === 'km' 
    ? `${formatNumber(Math.round(distanceError))} km` 
    : `${formatNumber(Math.round(convertToMiles(distanceError)))} miles`;

  return (
    <div className="flex flex-col space-y-4 w-full max-w-5xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Round Result</CardTitle>
          <CardDescription>{event.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96">
              <PhotoViewer src={event.imageUrl} alt={event.description} />
            </div>
            
            <div className="h-96">
              <GameMap 
                onLocationSelect={() => {}} 
                selectedLocation={guess.location}
                correctLocation={event.location}
                showCorrectPin={true}
                isDisabled={true}
                userAvatar={userAvatar}
              />
            </div>
            
            <div className="md:col-span-2 flex flex-col space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Location</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your guess was</p>
                    <p className="font-medium">{formattedDistance} away</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Correct location: {event.location.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
                    <p className="font-medium">{formatNumber(locationScore)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Year</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your guess was</p>
                    <p className="font-medium">{Math.abs(yearError)} years away</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      You guessed: {guess.year} | Actual: {event.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
                    <p className="font-medium">{formatNumber(timeScore)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Total Round Score</h3>
                  <p className="font-bold text-xl">{formatNumber(totalScore)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onNextRound} className="w-full">
            {isLastRound ? 'See Final Results' : 'Next Round'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RoundResultComponent;
