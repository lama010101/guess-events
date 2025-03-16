
import React from 'react';
import { Button } from "@/components/ui/button";
import { LightbulbIcon, MapPinIcon } from "lucide-react";
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
  timeHintUsed: boolean;
  locationHintUsed: boolean;
  hintsAvailable: number;
  disabled?: boolean;
  timeHintRange?: { min: number; max: number };
  locationHintRegion?: { lat: number; lng: number; radiusKm: number };
}

const HintSystem: React.FC<HintSystemProps> = ({
  onTimeHint,
  onLocationHint,
  timeHintUsed,
  locationHintUsed,
  hintsAvailable,
  disabled = false,
  timeHintRange,
  locationHintRegion
}) => {
  return (
    <div className="flex flex-col space-y-4 mb-4">
      <div className="flex space-x-2 justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onTimeHint}
                disabled={disabled || timeHintUsed || hintsAvailable === 0}
                className={`${timeHintUsed ? 'bg-gray-100' : ''}`}
              >
                <LightbulbIcon className="h-4 w-4 mr-2" />
                Time Hint {timeHintUsed ? '(Used)' : ''}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{timeHintUsed ? 'Hint already used' : 'Narrows the year range by 50%'}</p>
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
                disabled={disabled || locationHintUsed || hintsAvailable === 0}
                className={`${locationHintUsed ? 'bg-gray-100' : ''}`}
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                Location Hint {locationHintUsed ? '(Used)' : ''}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{locationHintUsed ? 'Hint already used' : 'Shows the region where the event occurred'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-sm py-1 px-2 bg-gray-100 rounded-lg flex items-center">
          <span className="font-medium">{hintsAvailable}</span>
          <span className="ml-1 text-gray-500">hints left</span>
        </div>
      </div>
      
      {/* Display active hint information */}
      {(timeHintUsed && timeHintRange) && (
        <div className="text-center">
          <Badge variant="secondary" className="px-3 py-1">
            Time Hint: The event occurred between {timeHintRange.min} and {timeHintRange.max}
          </Badge>
        </div>
      )}
      
      {(locationHintUsed && locationHintRegion) && (
        <div className="text-center">
          <Badge variant="secondary" className="px-3 py-1">
            Location Hint: The event occurred within {locationHintRegion.radiusKm} km of a region
          </Badge>
        </div>
      )}
    </div>
  );
};

export default HintSystem;
