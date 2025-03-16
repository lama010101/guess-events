
import React from 'react';
import { Button } from "@/components/ui/button";
import { Lightbulb, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HintSystemProps {
  hintsUsed: { time: boolean; location: boolean };
  hintsAvailable: number;
  onTimeHint: () => void;
  onLocationHint: () => void;
  disabled?: boolean;
}

const HintSystem: React.FC<HintSystemProps> = ({
  hintsUsed,
  hintsAvailable,
  onTimeHint,
  onLocationHint,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm font-medium mr-1">Hints:</div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              onClick={onTimeHint}
              disabled={disabled || hintsUsed.time || hintsAvailable <= 0}
              className={`relative ${hintsUsed.time ? 'opacity-50' : ''}`}
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Time hint: Get the decade</p>
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
              disabled={disabled || hintsUsed.location || hintsAvailable <= 0}
              className={`relative ${hintsUsed.location ? 'opacity-50' : ''}`}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Location hint: Narrow down the region</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="text-xs text-muted-foreground">
        {hintsAvailable} remaining
      </div>
    </div>
  );
};

export default HintSystem;
