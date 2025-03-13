
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
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md rounded-b-lg z-50">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold">Time Trek</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div>
              <AuthButton topBar={true} />
            </div>
            
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
      </div>
    </header>
  );
};

export default HomeHeader;
