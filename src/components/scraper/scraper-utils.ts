
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { ScraperSettings } from '@/types/scraper';

export const DEFAULT_SCRAPER_SETTINGS: Partial<ScraperSettings> = {
  auto_run_interval: 24, // 24 hours
  is_running: false,
  enabled_sources: [
    "USA Today Historical Events",
    "Rare Historical Photos",
    "Demilked Historical Pics"
  ],
  custom_sources: [],
  max_images_to_import: 50
};

export interface ScraperProgressState {
  isStartingScraper: boolean;
  isScraperRunning: boolean;
  scraperProgress: number;
  scraperResults: any | null;
}

export const useScraperProgress = (scraperSettings?: ScraperSettings) => {
  const { toast } = useToast();
  const [state, setState] = useState<ScraperProgressState>({
    isStartingScraper: false,
    isScraperRunning: false,
    scraperProgress: 0,
    scraperResults: null
  });

  // Update state when scraper settings load
  useEffect(() => {
    if (scraperSettings) {
      setState(prev => ({
        ...prev,
        isScraperRunning: scraperSettings.is_running || false
      }));
    }
  }, [scraperSettings]);

  const startScraper = async (
    enabledSources: string[] | undefined,
    updateSettings: (settings: Partial<ScraperSettings>) => Promise<void>,
    onComplete: () => void
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isStartingScraper: true,
        scraperProgress: 10,
        scraperResults: null
      }));
      
      // Update scraper status to running
      await updateSettings({
        is_running: true,
        last_run_at: new Date().toISOString()
      });
      
      setState(prev => ({ ...prev, scraperProgress: 30 }));
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('scrape-historical-events', {
        body: { 
          sourcesToScrape: enabledSources || DEFAULT_SCRAPER_SETTINGS.enabled_sources,
          customSources: scraperSettings?.custom_sources || [],
          maxImagesToImport: scraperSettings?.max_images_to_import || 50
        }
      });
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        scraperProgress: 90,
        scraperResults: data
      }));
      
      // Update scraper status to not running
      await updateSettings({
        is_running: false
      });
      
      // Call onComplete callback to refresh data
      onComplete();
      
      setState(prev => ({ ...prev, scraperProgress: 100 }));
      
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
      await updateSettings({
        is_running: false
      });
      
    } finally {
      setState(prev => ({ ...prev, isStartingScraper: false }));
      setTimeout(() => setState(prev => ({ ...prev, scraperProgress: 0 })), 2000);
    }
  };

  const stopScraper = async (updateSettings: (settings: Partial<ScraperSettings>) => Promise<void>) => {
    try {
      await updateSettings({
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

  return {
    ...state,
    startScraper,
    stopScraper,
    setScraperProgress: (progress: number) => 
      setState(prev => ({ ...prev, scraperProgress: progress }))
  };
};
