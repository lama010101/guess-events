
import React from 'react';
import { RoundResult } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, convertToMiles } from '@/utils/gameUtils';
import GameMap from './GameMap';
import PhotoViewer from './PhotoViewer';
import { Trophy } from 'lucide-react';

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
    
  const isPerfectLocation = distanceError < 0.05; // Less than 50m
  const isPerfectYear = yearError === 0;
  const isPerfectScore = totalScore === 10000;

  return (
    <div className="flex flex-col space-y-4 w-full max-w-5xl mx-auto pb-20">
      {/* Fixed header for the Round Result screen */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md rounded-b-lg p-4">
        <h2 className="text-xl font-bold text-center">Round Result</h2>
      </div>
      
      <div className="pt-16">
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
                      {isPerfectLocation ? (
                        <p className="font-medium text-green-500">Perfect!</p>
                      ) : (
                        <p className="font-medium">{formattedDistance} away</p>
                      )}
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
                      {isPerfectYear ? (
                        <p className="font-medium text-green-500">Perfect!</p>
                      ) : (
                        <p className="font-medium">{Math.abs(yearError)} years away</p>
                      )}
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
                
                <div className={`${isPerfectScore ? 'bg-green-50' : 'bg-blue-50'} dark:bg-blue-900/20 rounded-lg p-4`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Total Round Score</h3>
                    <div className="flex items-center">
                      {isPerfectScore && (
                        <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                      )}
                      <p className={`font-bold text-xl ${isPerfectScore ? 'text-green-600' : ''}`}>
                        {formatNumber(totalScore)}
                      </p>
                    </div>
                  </div>
                  
                  {isPerfectScore && (
                    <p className="text-green-600 font-medium mt-2">Perfect Score! Achievement unlocked.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Fixed footer with Next Round button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-white shadow-md border-t border-gray-200 p-4">
        <div className="container mx-auto">
          <Button onClick={onNextRound} className="w-full">
            {isLastRound ? 'See Final Results' : 'Next Round'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoundResultComponent;
