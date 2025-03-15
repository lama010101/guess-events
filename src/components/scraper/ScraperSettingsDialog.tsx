
import React, { useState, useEffect } from 'react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScraperSettings } from '@/types/scraper';
import { DEFAULT_SCRAPER_SETTINGS } from './scraper-utils';

interface ScraperSettingsDialogProps {
  settings: ScraperSettings | undefined;
  onSave: (settings: Partial<ScraperSettings>) => void;
}

const ScraperSettingsDialog: React.FC<ScraperSettingsDialogProps> = ({ 
  settings, 
  onSave 
}) => {
  const [newSettings, setNewSettings] = useState<Partial<ScraperSettings>>(DEFAULT_SCRAPER_SETTINGS);
  
  useEffect(() => {
    if (settings) {
      setNewSettings(settings);
    }
  }, [settings]);
  
  const handleSourceToggle = (sourceName: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    
    if (checked) {
      setNewSettings({
        ...newSettings,
        enabled_sources: [...(newSettings.enabled_sources || []), sourceName]
      });
    } else {
      setNewSettings({
        ...newSettings,
        enabled_sources: (newSettings.enabled_sources || [])
          .filter(source => source !== sourceName)
      });
    }
  };
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Scraper Settings</DialogTitle>
        <DialogDescription>
          Configure the behavior of the web scraper
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="auto-run-interval">Auto-run Interval (hours)</Label>
          <Select 
            value={String(newSettings.auto_run_interval)}
            onValueChange={(value) => setNewSettings({
              ...newSettings,
              auto_run_interval: parseInt(value)
            })}
          >
            <SelectTrigger id="auto-run-interval">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="2">2 hours</SelectItem>
              <SelectItem value="6">6 hours</SelectItem>
              <SelectItem value="12">12 hours</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
              <SelectItem value="48">48 hours</SelectItem>
              <SelectItem value="72">72 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Enabled Sources</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="source-usatoday"
                checked={newSettings.enabled_sources?.includes("USA Today Historical Events")}
                onCheckedChange={(checked) => handleSourceToggle("USA Today Historical Events", checked)}
              />
              <label
                htmlFor="source-usatoday"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                USA Today Historical Events
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="source-rare"
                checked={newSettings.enabled_sources?.includes("Rare Historical Photos")}
                onCheckedChange={(checked) => handleSourceToggle("Rare Historical Photos", checked)}
              />
              <label
                htmlFor="source-rare"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Rare Historical Photos
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="source-demilked"
                checked={newSettings.enabled_sources?.includes("Demilked Historical Pics")}
                onCheckedChange={(checked) => handleSourceToggle("Demilked Historical Pics", checked)}
              />
              <label
                htmlFor="source-demilked"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Demilked Historical Pics
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setNewSettings(settings || DEFAULT_SCRAPER_SETTINGS)}>
          Reset
        </Button>
        <Button onClick={() => onSave(newSettings)}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ScraperSettingsDialog;
