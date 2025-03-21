
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Settings, Clock, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScraperSettings } from '@/types/scraper';
import { useScraperProgress } from './scraper-utils';
import ScraperProgressBar from './ScraperProgressBar';
import ScraperResults from './ScraperResults';
import ScraperSettingsDialog from './ScraperSettingsDialog';

interface ScraperControlsProps {
  scraperSettings: ScraperSettings | undefined;
  isLoadingSettings: boolean;
  refetchEvents: () => void;
  refetchLogs: () => void;
  refetchSettings: () => void;
  updateSettingsMutation: any;
}

const ScraperControls: React.FC<ScraperControlsProps> = ({
  scraperSettings,
  isLoadingSettings,
  refetchEvents,
  refetchLogs,
  refetchSettings,
  updateSettingsMutation
}) => {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const {
    isStartingScraper,
    isScraperRunning,
    scraperProgress,
    scraperResults,
    startScraper,
    stopScraper
  } = useScraperProgress(scraperSettings);
  
  const updateSettings = async (settings: Partial<ScraperSettings>): Promise<void> => {
    try {
      await updateSettingsMutation.mutateAsync(settings);
      toast({
        title: "Settings Updated",
        description: "Scraper settings have been updated successfully."
      });
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Settings Update Failed",
        description: "There was an error updating the settings. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleStartScraper = () => {
    startScraper(
      scraperSettings?.enabled_sources, 
      updateSettings,
      () => {
        refetchEvents();
        refetchLogs();
        refetchSettings();
      }
    );
  };
  
  const handleStopScraper = () => {
    stopScraper(updateSettings);
  };
  
  const handleSaveSettings = (newSettings: Partial<ScraperSettings>) => {
    updateSettings(newSettings);
  };
  
  const forceRefresh = () => {
    refetchEvents();
    refetchLogs();
    refetchSettings();
    toast({
      title: "Data Refreshed",
      description: "All scraper data has been refreshed from the database."
    });
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
          <ScraperProgressBar progress={scraperProgress} />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isScraperRunning ? (
                <Button 
                  variant="destructive" 
                  onClick={handleStopScraper}
                  disabled={isStartingScraper}
                  className="gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Stop Scraper
                </Button>
              ) : (
                <Button 
                  onClick={handleStartScraper}
                  disabled={isStartingScraper}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Scraper
                </Button>
              )}
              
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Scraper Settings
                  </Button>
                </DialogTrigger>
                <ScraperSettingsDialog 
                  settings={scraperSettings}
                  onSave={handleSaveSettings}
                />
              </Dialog>
              
              <Button 
                variant="outline" 
                onClick={forceRefresh} 
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh Data
              </Button>
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
          
          <ScraperResults results={scraperResults} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScraperControls;
