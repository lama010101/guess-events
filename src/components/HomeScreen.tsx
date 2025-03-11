
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Play, Shield, Copy, Users, Trophy } from "lucide-react";
import { GameSettings } from '@/types/game';
import { useToast } from "@/hooks/use-toast";
import AuthButton from './AuthButton';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GameSettings>({
    distanceUnit: 'km',
    timerEnabled: false,
    timerDuration: 5,
    gameMode: 'daily'
  });

  const handleStartGame = (mode: 'daily' | 'friends') => {
    const newSettings = {
      ...settings,
      gameMode: mode
    };
    
    if (mode === 'friends') {
      // Copy the game session link to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast({
            title: "Link copied!",
            description: "Game link copied to clipboard. Share with your friends!",
          });
        })
        .catch(err => {
          toast({
            title: "Failed to copy link",
            description: "Please try again or share the URL manually.",
            variant: "destructive",
          });
        });
    }
    
    onStartGame(newSettings);
  };

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f3f3f3]">
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>
      
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">GUESS HISTORY</CardTitle>
          <CardDescription>Test your knowledge of historical events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium leading-none">Enable Timer</h4>
                  <p className="text-sm text-muted-foreground">
                    Play with a time limit for each round
                  </p>
                </div>
                <Switch
                  id="timer-enabled"
                  checked={settings.timerEnabled}
                  onCheckedChange={(checked) => handleSettingChange('timerEnabled', checked)}
                />
              </div>
              
              {settings.timerEnabled && (
                <div className="pt-2 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="timer-duration">Timer Duration: {settings.timerDuration} minutes</Label>
                  </div>
                  <Slider
                    id="timer-duration"
                    min={1}
                    max={10}
                    step={1}
                    value={[settings.timerDuration]}
                    onValueChange={(value) => handleSettingChange('timerDuration', value[0])}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => handleStartGame('daily')}
          >
            <Trophy className="mr-2 h-4 w-4" /> Daily Competition
          </Button>
          <Button 
            className="w-full" 
            variant="outline" 
            size="lg" 
            onClick={() => handleStartGame('friends')}
          >
            <Users className="mr-2 h-4 w-4" /> Play with Friends
          </Button>
          <div className="flex w-full justify-center">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center">
              <Shield className="mr-1 h-3 w-3" /> Admin Panel
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default HomeScreen;
