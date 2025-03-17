
import React from 'react';
import { RoundResult } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AchievementsBadge from './result/AchievementsBadge';
import LocationResult from './result/LocationResult';
import YearResult from './result/YearResult';
import TotalScoreCard from './result/TotalScoreCard';
import ResultFooter from './result/ResultFooter';
import ResultMedia from './result/ResultMedia';

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
  const { event, guess, distanceError, yearError, locationScore, timeScore, totalScore, hintsUsed, achievements } = result;
  
  const isPerfectLocation = distanceError < 0.05; // Less than 50m
  const isPerfectYear = yearError === 0;
  const isPerfectScore = totalScore === 10000;

  return (
    <div className="flex flex-col space-y-4 w-full max-w-5xl mx-auto pb-20 z-20">
      <div className="pt-0">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Round Result</CardTitle>
            <CardDescription>{event.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResultMedia 
              imageUrl={event.imageUrl}
              eventDescription={event.description}
              userGuessLocation={guess.location!}
              correctLocation={event.location}
              userAvatar={userAvatar}
            />
              
            <div className="md:col-span-2 flex flex-col space-y-4 mt-4">
              <AchievementsBadge achievements={achievements} />

              <LocationResult 
                distanceError={distanceError}
                locationScore={locationScore}
                locationName={event.location.name}
                isPerfectLocation={isPerfectLocation}
                distanceUnit={distanceUnit}
                locationHintUsed={hintsUsed?.location}
              />
              
              <YearResult
                yearError={yearError}
                timeScore={timeScore}
                guessedYear={guess.year}
                actualYear={event.year}
                isPerfectYear={isPerfectYear}
                timeHintUsed={hintsUsed?.time}
              />
              
              <TotalScoreCard 
                totalScore={totalScore}
                isPerfectScore={isPerfectScore}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <ResultFooter 
        onNextRound={onNextRound}
        isLastRound={isLastRound}
      />
    </div>
  );
};

export default RoundResultComponent;
