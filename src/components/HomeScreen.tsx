
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GameSettings } from '@/types/game';
import { Play, Clock, MapPin, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GameSettings>({
    distanceUnit: 'km',
    timerEnabled: false,
    timerDuration: 5,
  });

  const handleStartGame = () => {
    onStartGame(settings);
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "Share this link with friends to challenge them.",
        });
      })
      .catch(err => {
        toast({
          title: "Failed to copy link",
          description: "Please try again or share the URL manually.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            EVENTGUESSR
          </CardTitle>
          <CardDescription>
            Test your knowledge of historical events by guessing when and where they happened
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Label htmlFor="distanceUnit" className="text-sm font-medium">
                  Distance Unit
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="kmUnit" className="text-sm">km</Label>
                <Switch
                  id="distanceUnit"
                  checked={settings.distanceUnit === 'miles'}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, distanceUnit: checked ? 'miles' : 'km'})
                  }
                />
                <Label htmlFor="milesUnit" className="text-sm">miles</Label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Label htmlFor="timerEnabled" className="text-sm font-medium">
                  Enable Timer
                </Label>
              </div>
              <Switch
                id="timerEnabled"
                checked={settings.timerEnabled}
                onCheckedChange={(checked) => 
                  setSettings({...settings, timerEnabled: checked})
                }
              />
            </div>
          </div>
          
          <Button 
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={handleStartGame}
          >
            <Play className="mr-2 h-4 w-4" /> Start Game
          </Button>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleShareClick}
            >
              <Share2 className="mr-2 h-4 w-4" /> Challenge a Friend
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-xs text-gray-500">
          5 rounds per game • 10,000 points per round
        </CardFooter>
      </Card>
    </div>
  );
};

export default HomeScreen;
