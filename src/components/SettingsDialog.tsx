
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { GameSettings } from '@/types/game';

interface SettingsDialogProps {
  open: boolean;
  settings: GameSettings;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: GameSettings) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  settings,
  onOpenChange,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = React.useState<GameSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>
            Adjust your preferences for the current game session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="distanceUnit" className="text-sm font-medium">
                Distance Unit
              </Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="kmUnit" className="text-sm">km</Label>
                <Switch
                  id="distanceUnit"
                  checked={localSettings.distanceUnit === 'miles'}
                  onCheckedChange={(checked) => 
                    setLocalSettings({...localSettings, distanceUnit: checked ? 'miles' : 'km'})
                  }
                />
                <Label htmlFor="milesUnit" className="text-sm">miles</Label>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <Label htmlFor="timerEnabled" className="text-sm font-medium">
                Enable Timer
              </Label>
              <Switch
                id="timerEnabled"
                checked={localSettings.timerEnabled}
                onCheckedChange={(checked) => 
                  setLocalSettings({...localSettings, timerEnabled: checked})
                }
              />
            </div>
            
            {localSettings.timerEnabled && (
              <div className="pt-4">
                <Label htmlFor="timerDuration" className="text-sm font-medium block mb-2">
                  Timer Duration: {localSettings.timerDuration} minutes
                </Label>
                <Slider
                  id="timerDuration"
                  min={1}
                  max={10}
                  step={1}
                  value={[localSettings.timerDuration]}
                  onValueChange={(value) => 
                    setLocalSettings({...localSettings, timerDuration: value[0]})
                  }
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>1 min</span>
                  <span>5 min</span>
                  <span>10 min</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
