
import React from 'react';
import { Button } from "@/components/ui/button";
import { LightbulbIcon, MapPinIcon, PlayCircleIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface HintSystemProps {
  onTimeHint: () => void;
  onLocationHint: () => void;
  onWatchAd?: () => void;
  timeHintUsed: boolean;
  locationHintUsed: boolean;
  hintsAvailable: number;
  hintCoins?: number;
  disabled?: boolean;
  timeHintRange?: { maskedYear: string };
  locationHintRegion?: { country: string; lat: number; lng: number; };
  showWatchAdButton?: boolean;
}

const HintSystem: React.FC<HintSystemProps> = ({
  onTimeHint,
  onLocationHint,
  onWatchAd,
  timeHintUsed,
  locationHintUsed,
  hintsAvailable,
  hintCoins,
  disabled = false,
  timeHintRange,
  locationHintRegion,
  showWatchAdButton = false
}) => {
  return (
    <div className="flex flex-col space-y-4 mb-4">
      <div className="flex flex-wrap gap-2 justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onTimeHint}
                disabled={disabled || (timeHintUsed && hintsAvailable === 0)}
                className={`${timeHintUsed ? 'bg-gray-100' : ''}`}
              >
                <LightbulbIcon className="h-4 w-4 mr-2" />
                Time Hint {timeHintUsed ? '(Used)' : ''}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{timeHintUsed ? 'Hint already used' : 'Shows the year with the last digit hidden'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onLocationHint}
                disabled={disabled || (locationHintUsed && hintsAvailable === 0)}
                className={`${locationHintUsed ? 'bg-gray-100' : ''}`}
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                Location Hint {locationHintUsed ? '(Used)' : ''}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{locationHintUsed ? 'Hint already used' : 'Shows the country where the event occurred'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-sm py-1 px-2 bg-gray-100 rounded-lg flex items-center">
          <span className="font-medium">{hintsAvailable}</span>
          <span className="ml-1 text-gray-500">hints left</span>
        </div>
        
        {hintCoins !== undefined && (
          <div className="text-sm py-1 px-2 bg-yellow-100 text-yellow-800 rounded-lg flex items-center">
            <span className="font-medium">{hintCoins}</span>
            <span className="ml-1">hint coins</span>
          </div>
        )}
      </div>
      
      {/* Watch Ad button */}
      {showWatchAdButton && onWatchAd && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={onWatchAd} className="bg-green-50 hover:bg-green-100">
            <PlayCircleIcon className="h-4 w-4 mr-2" />
            Watch Ad for 4 Hint Coins
          </Button>
        </div>
      )}
      
      {/* Display active hint information */}
      {(timeHintUsed && timeHintRange) && (
        <div className="text-center">
          <Badge variant="secondary" className="px-3 py-1">
            Time Hint: The event occurred around {timeHintRange.maskedYear}
          </Badge>
        </div>
      )}
      
      {(locationHintUsed && locationHintRegion) && (
        <div className="text-center">
          <Badge variant="secondary" className="px-3 py-1">
            Location Hint: The event occurred in {locationHintRegion.country}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default HintSystem;
