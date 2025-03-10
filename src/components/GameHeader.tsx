
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Share2, Home } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber } from '@/utils/gameUtils';

interface GameHeaderProps {
  currentRound: number;
  totalRounds: number;
  cumulativeScore: number;
  onShare?: () => void;
  onSettingsClick?: () => void;
  onHomeClick?: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  currentRound, 
  totalRounds, 
  cumulativeScore,
  onShare,
  onSettingsClick,
  onHomeClick
}) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 shadow-md rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Round</span>
          <span className="font-bold">{currentRound} of {totalRounds}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Score</span>
          <span className="font-bold">{formatNumber(cumulativeScore)}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onHomeClick}
                className="h-8 w-8"
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to Home Screen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onShare}
                className="h-8 w-8"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share this game</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onSettingsClick}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Game settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default GameHeader;
