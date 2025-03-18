
import React from 'react';
import { Button } from "@/components/ui/button";
import { Share2, Home } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber } from '@/utils/gameUtils';
import AuthButton from './AuthButton';

interface GameHeaderProps {
  currentRound: number;
  totalRounds: number;
  cumulativeScore: number;
  onShare?: () => void;
  onHomeClick?: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  currentRound, 
  totalRounds, 
  cumulativeScore,
  onShare,
  onHomeClick
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md rounded-b-lg p-4 flex items-center justify-between">
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
        <AuthButton topBar={true} />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onHomeClick}
                className="h-8 w-8"
                type="button"
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
                type="button"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share this game</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default GameHeader;
