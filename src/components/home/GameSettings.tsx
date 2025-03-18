
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Lightbulb } from 'lucide-react';
import { GameSettings } from '@/types/game';

interface GameSettingsProps {
  settings: GameSettings;
  onSettingChange: (key: keyof GameSettings, value: any) => void;
}

const GameSettingsComponent: React.FC<GameSettingsProps> = ({
  settings,
  onSettingChange
}) => {
  return (
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
          onCheckedChange={(checked) => onSettingChange('timerEnabled', checked)}
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
            onValueChange={(value) => onSettingChange('timerDuration', value[0])}
          />
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        <div className="space-y-1">
          <h4 className="font-medium leading-none">Enable Hints</h4>
          <p className="text-sm text-muted-foreground">
            Get help with location and time period (2 hints per round)
          </p>
        </div>
        <Switch
          id="hints-enabled"
          checked={settings.hintsEnabled}
          onCheckedChange={(checked) => onSettingChange('hintsEnabled', checked)}
        />
      </div>
    </div>
  );
};

export default GameSettingsComponent;
