
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Play, Shield } from "lucide-react";
import { GameSettings } from '@/types/game';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const [settings, setSettings] = useState<GameSettings>({
    distanceUnit: 'km',
    timerEnabled: false,
    timerDuration: 5
  });

  const handleStartGame = () => {
    onStartGame(settings);
  };

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">Historical Photo Hunt</CardTitle>
          <CardDescription>Test your knowledge of historical events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium leading-none">Distance Unit</h4>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred unit of measurement
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={settings.distanceUnit === 'km' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSettingChange('distanceUnit', 'km')}
                >
                  Kilometers
                </Button>
                <Button
                  variant={settings.distanceUnit === 'miles' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSettingChange('distanceUnit', 'miles')}
                >
                  Miles
                </Button>
              </div>
            </div>

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
          <Button className="w-full" size="lg" onClick={handleStartGame}>
            <Play className="mr-2 h-4 w-4" /> Start Game
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
