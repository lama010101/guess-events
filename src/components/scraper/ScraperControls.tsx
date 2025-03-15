
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Settings, RefreshCw, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { ScraperSettings } from '@/types/scraper';

interface ScraperControlsProps {
  scraperSettings: ScraperSettings | undefined;
  isLoadingSettings: boolean;
  refetchEvents: () => void;
  refetchLogs: () => void;
  refetchSettings: () => void;
  updateSettingsMutation: any;
}

const DEFAULT_SCRAPER_SETTINGS: Partial<ScraperSettings> = {
  auto_run_interval: 24, // 24 hours
  is_running: false,
  enabled_sources: [
    "USA Today Historical Events",
    "Rare Historical Photos",
    "Demilked Historical Pics"
  ]
};

const ScraperControls: React.FC<ScraperControlsProps> = ({
  scraperSettings,
  isLoadingSettings,
  refetchEvents,
  refetchLogs,
  refetchSettings,
  updateSettingsMutation
}) => {
  const { toast } = useToast();
  
  const [isStartingScraper, setIsStartingScraper] = useState(false);
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [scraperProgress, setScraperProgress] = useState(0);
  const [scraperResults, setScraperResults] = useState<any>(null);
  const [newSettings, setNewSettings] = useState<Partial<ScraperSettings>>(DEFAULT_SCRAPER_SETTINGS);
  
  // Set state when scraper settings are loaded
  React.useEffect(() => {
    if (scraperSettings) {
      setNewSettings(scraperSettings);
      setIsScraperRunning(scraperSettings.is_running || false);
    }
  }, [scraperSettings]);
  
  // Start web scraper
  const startScraper = async () => {
    try {
      setIsStartingScraper(true);
      setScraperProgress(10);
      setScraperResults(null);
      
      // Update scraper status to running
      await updateSettingsMutation.mutateAsync({
        is_running: true,
        last_run_at: new Date().toISOString()
      });
      
      setScraperProgress(30);
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('scrape-historical-events', {
        body: { 
          sourcesToScrape: newSettings?.enabled_sources || DEFAULT_SCRAPER_SETTINGS.enabled_sources 
        }
      });
      
      if (error) throw error;
      
      setScraperProgress(90);
      setScraperResults(data);
      
      // Update scraper status to not running
      await updateSettingsMutation.mutateAsync({
        is_running: false
      });
      
      // Refresh data
      refetchEvents();
      refetchLogs();
      refetchSettings();
      
      setScraperProgress(100);
      
      toast({
        title: "Scraper Completed",
        description: `Added ${data.newEvents} new events from ${data.sourcesProcessed} sources.`,
      });
      
    } catch (error: any) {
      console.error('Error running scraper:', error);
      toast({
        title: "Error",
        description: `Failed to run scraper: ${error.message}`,
        variant: "destructive"
      });
      
      // Update scraper status to not running on error
      await updateSettingsMutation.mutateAsync({
        is_running: false
      });
      
    } finally {
      setIsStartingScraper(false);
      setTimeout(() => setScraperProgress(0), 2000);
    }
  };

  // Stop web scraper
  const stopScraper = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        is_running: false
      });
      
      toast({
        title: "Scraper Stopped",
        description: "The scraper has been stopped.",
      });
      
    } catch (error: any) {
      console.error('Error stopping scraper:', error);
      toast({
        title: "Error",
        description: `Failed to stop scraper: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Save scraper settings
  const saveSettings = () => {
    updateSettingsMutation.mutate(newSettings);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Web Scraper Controls</CardTitle>
        <CardDescription>
          Run the web scraper to collect new historical events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {scraperProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Scraping progress</span>
                <span>{scraperProgress}%</span>
              </div>
              <Progress value={scraperProgress} className="h-2" />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isScraperRunning ? (
                <Button 
                  variant="destructive" 
                  onClick={stopScraper}
                  disabled={isStartingScraper}
                  className="gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Stop Scraper
                </Button>
              ) : (
                <Button 
                  onClick={startScraper}
                  disabled={isStartingScraper}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Scraper
                </Button>
              )}
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Scraper Settings
                  </Button>
                </DialogTrigger>
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
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewSettings({
                                  ...newSettings,
                                  enabled_sources: [...(newSettings.enabled_sources || []), "USA Today Historical Events"]
                                });
                              } else {
                                setNewSettings({
                                  ...newSettings,
                                  enabled_sources: (newSettings.enabled_sources || [])
                                    .filter(source => source !== "USA Today Historical Events")
                                });
                              }
                            }}
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
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewSettings({
                                  ...newSettings,
                                  enabled_sources: [...(newSettings.enabled_sources || []), "Rare Historical Photos"]
                                });
                              } else {
                                setNewSettings({
                                  ...newSettings,
                                  enabled_sources: (newSettings.enabled_sources || [])
                                    .filter(source => source !== "Rare Historical Photos")
                                });
                              }
                            }}
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
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewSettings({
                                  ...newSettings,
                                  enabled_sources: [...(newSettings.enabled_sources || []), "Demilked Historical Pics"]
                                });
                              } else {
                                setNewSettings({
                                  ...newSettings,
                                  enabled_sources: (newSettings.enabled_sources || [])
                                    .filter(source => source !== "Demilked Historical Pics")
                                });
                              }
                            }}
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
                    <Button variant="outline" onClick={() => setNewSettings(scraperSettings || DEFAULT_SCRAPER_SETTINGS)}>
                      Reset
                    </Button>
                    <Button onClick={saveSettings}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {scraperSettings?.last_run_at 
                  ? `Last run: ${format(new Date(scraperSettings.last_run_at), 'MMM d, yyyy HH:mm')}` 
                  : 'Never run'}
              </span>
            </div>
          </div>
          
          {scraperResults && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Latest Scraper Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                  <div className="text-xl font-bold">{scraperResults.sourcesProcessed}</div>
                  <div className="text-xs text-muted-foreground">Sources Processed</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                  <div className="text-xl font-bold">{scraperResults.totalEvents}</div>
                  <div className="text-xs text-muted-foreground">Total Events Found</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                  <div className="text-xl font-bold text-green-600">{scraperResults.newEvents}</div>
                  <div className="text-xs text-muted-foreground">New Events Added</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                  <div className="text-xl font-bold text-amber-600">{scraperResults.existingEvents}</div>
                  <div className="text-xs text-muted-foreground">Duplicate Events Skipped</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScraperControls;
