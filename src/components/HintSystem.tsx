
import React from 'react';
import { Button } from "@/components/ui/button";
import { Lightbulb, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HintSystemProps {
  currentEvent: any;
  gameMode: string;
  hints: {
    available: number;
    used: string[];
    yearHintUsed: boolean;
    locationHintUsed: boolean;
  };
  onUseHint: (hintType: string) => void;
  year?: number;
  isTimerEnabled?: boolean;
}

const HintSystem: React.FC<HintSystemProps> = ({
  currentEvent,
  gameMode,
  hints,
  onUseHint,
  year,
  isTimerEnabled
}) => {
  const { user } = useAuth();
  
  const isYearHintDisabled = hints.yearHintUsed || hints.available <= 0;
  const isLocationHintDisabled = hints.locationHintUsed || hints.available <= 0;
  
  return (
    <div className="flex items-center space-x-2">
      {year && (
        <div className="flex items-center bg-background text-foreground rounded-md p-2 shadow-sm">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="font-medium">{year}</span>
        </div>
      )}
      
      <div className="flex items-center ml-4">
        <span className="mr-2 text-sm font-medium">Hints</span>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUseHint('year')}
            disabled={isYearHintDisabled}
            title={isYearHintDisabled ? "Hint already used or no hints available" : "Get a hint about the year"}
            className="flex items-center h-8"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            <span>Year</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUseHint('location')}
            disabled={isLocationHintDisabled}
            title={isLocationHintDisabled ? "Hint already used or no hints available" : "Get a hint about the location"}
            className="flex items-center h-8"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            <span>Location</span>
          </Button>
        </div>
        
        {hints.available > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            ({hints.available} left)
          </span>
        )}
      </div>
    </div>
  );
};

export default HintSystem;
