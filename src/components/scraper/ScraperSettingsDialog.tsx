
import React, { useState, useEffect } from 'react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScraperSettings } from '@/types/scraper';
import { DEFAULT_SCRAPER_SETTINGS } from './scraper-utils';
import { useToast } from "@/hooks/use-toast";

interface ScraperSettingsDialogProps {
  settings: ScraperSettings | undefined;
  onSave: (settings: Partial<ScraperSettings>) => void;
}

const ScraperSettingsDialog: React.FC<ScraperSettingsDialogProps> = ({ 
  settings, 
  onSave 
}) => {
  const { toast } = useToast();
  const [newSettings, setNewSettings] = useState<Partial<ScraperSettings>>(DEFAULT_SCRAPER_SETTINGS);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  const handleAddCustomSource = () => {
    if (!newSourceName || !newSourceUrl) return;
    
    setNewSettings({
      ...newSettings,
      custom_sources: [
        ...(newSettings.custom_sources || []),
        { name: newSourceName, url: newSourceUrl }
      ]
    });
    
    setNewSourceName('');
    setNewSourceUrl('');
  };
  
  const handleRemoveCustomSource = (index: number) => {
    setNewSettings({
      ...newSettings,
      custom_sources: (newSettings.custom_sources || []).filter((_, i) => i !== index)
    });
  };
  
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      
      // Make a copy of the settings to send to the server
      const settingsToSave = { ...newSettings };
      
      await onSave(settingsToSave);
      
      toast({
        title: "Settings saved",
        description: "Scraper settings have been updated successfully."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving the settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
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
        
        <div className="space-y-2">
          <Label htmlFor="max-images">Maximum Images to Import</Label>
          <Select 
            value={String(newSettings.max_images_to_import || 50)}
            onValueChange={(value) => setNewSettings({
              ...newSettings,
              max_images_to_import: parseInt(value)
            })}
          >
            <SelectTrigger id="max-images">
              <SelectValue placeholder="Select maximum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 images</SelectItem>
              <SelectItem value="25">25 images</SelectItem>
              <SelectItem value="50">50 images</SelectItem>
              <SelectItem value="100">100 images</SelectItem>
              <SelectItem value="200">200 images</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Enabled Default Sources</Label>
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
        
        <Separator />
        
        <div className="space-y-3">
          <Label>Custom Sources</Label>
          
          {/* List of existing custom sources */}
          <div className="space-y-2">
            {newSettings.custom_sources?.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{source.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[280px]">{source.url}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveCustomSource(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {/* Add new custom source */}
          <div className="space-y-2 p-3 border rounded-md">
            <Label htmlFor="new-source-name">Add New Source</Label>
            <div className="space-y-2">
              <Input
                id="new-source-name"
                placeholder="Source Name"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
              />
              <Input
                id="new-source-url"
                placeholder="Source URL"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
              />
              <Button
                onClick={handleAddCustomSource}
                className="w-full"
                disabled={!newSourceName || !newSourceUrl}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button 
          onClick={handleSubmit} 
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ScraperSettingsDialog;
