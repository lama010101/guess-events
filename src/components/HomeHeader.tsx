
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AuthButton from './AuthButton';

interface HomeHeaderProps {
  onSettingsClick?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onSettingsClick }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md rounded-b-lg p-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold">Time Trek</h1>
      </div>
      <div className="flex items-center space-x-2">
        <AuthButton topBar={true} />
        
        {onSettingsClick && (
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
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
