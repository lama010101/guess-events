
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { HistoricalEventDB, ScraperLog, ScraperSettings } from '@/types/scraper';
import { importHistoricalEvents } from '@/integrations/supabase/events';

const DEFAULT_SCRAPER_SETTINGS: Partial<ScraperSettings> = {
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

export const useScraperAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch historical events
  const { 
    data: events = [], 
    isLoading: isLoadingEvents,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['historical-events'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('historical_events')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Add missing fields expected by the component
        return (data || []).map(event => ({
          ...event,
          title: event.location_name,
          event_date: event.year?.toString(),
          source_name: "Historical Database",
          source_url: "",
          deleted: event.deleted || false
        })) as HistoricalEventDB[];
      } catch (error) {
        console.error('Error fetching events:', error);
        return [] as HistoricalEventDB[];
      }
    }
  });

  // Fetch scraper logs using stored procedure
  const { 
    data: scraperLogs = [], 
    isLoading: isLoadingLogs,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['scraper-logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_scraper_logs');
        
        if (error) throw error;
        
        // Ensure data is an array
        if (!data) return [];
        
        // Handle both JSON array and single object responses
        const logsArray = Array.isArray(data) ? data : [data];
        
        // Transform to ScraperLog type with explicit type assertion
        return logsArray.map((item: any) => {
          // Ensure we have all required fields with defaults
          const log: ScraperLog = {
            id: item?.id || '',
            created_at: item?.created_at || new Date().toISOString(),
            sources_processed: item?.sources_processed || 0,
            total_events_found: item?.total_events_found || 0,
            new_events_added: item?.new_events_added || 0,
            failures: item?.failures || 0,
            details: []
          };
          
          // Process details array if it exists
          if (Array.isArray(item?.details)) {
            log.details = item.details.map((detail: any) => ({
              sourceName: detail?.sourceName || '',
              eventsFound: detail?.eventsFound || 0,
              newEvents: detail?.newEvents || 0,
              existingEvents: detail?.existingEvents || 0,
              status: detail?.status || '',
              error: detail?.error || null
            }));
          }
          
          return log;
        });
      } catch (error) {
        console.error('Error fetching scraper logs:', error);
        return [] as ScraperLog[];
      }
    }
  });

  // Fetch scraper settings using stored procedure
  const { 
    data: scraperSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['scraper-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_scraper_settings');
        
        if (error) {
          console.warn('Could not fetch scraper settings:', error);
          // If no settings found, return default
          return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
        }
        
        // No data returned
        if (!data) {
          return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
        }
        
        // Parse the response which could be an array or a single object
        const settingsData = Array.isArray(data) && data.length > 0 
          ? data[0] 
          : data;
        
        // Convert to proper type with safety checks and type assertion
        const settings: ScraperSettings = {
          id: (settingsData as any)?.id || 'default',
          auto_run_interval: parseInt(String((settingsData as any)?.auto_run_interval || 24)),
          last_run_at: (settingsData as any)?.last_run_at || null,
          is_running: Boolean((settingsData as any)?.is_running),
          enabled_sources: Array.isArray((settingsData as any)?.enabled_sources) 
            ? (settingsData as any).enabled_sources 
            : DEFAULT_SCRAPER_SETTINGS.enabled_sources || [],
          custom_sources: Array.isArray((settingsData as any)?.custom_sources)
            ? (settingsData as any).custom_sources
            : DEFAULT_SCRAPER_SETTINGS.custom_sources || [],
          max_images_to_import: parseInt(String((settingsData as any)?.max_images_to_import || 50)),
          created_at: (settingsData as any)?.created_at || new Date().toISOString(),
          updated_at: (settingsData as any)?.updated_at || new Date().toISOString()
        };
        
        return settings;
      } catch (error) {
        console.error('Error fetching scraper settings:', error);
        return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
      }
    }
  });

  // Mutation to bulk delete/restore events
  const bulkUpdateEventsMutation = useMutation({
    mutationFn: async ({ ids, deleted }: { ids: string[], deleted: boolean }) => {
      const { data, error } = await supabase
        .from('historical_events')
        .update({ deleted })
        .in('id', ids)
        .select('id');
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historical-events'] });
      toast({
        title: "Success",
        description: "Events updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update events: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutation to update scraper settings using stored procedure
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<ScraperSettings>) => {
      const { data, error } = await supabase.rpc('update_scraper_settings', {
        settings_json: settings
      });
      
      if (error) throw error;
      
      // Return with safe defaults and type assertion
      return {
        id: (data as any)?.id || 'default',
        auto_run_interval: (data as any)?.auto_run_interval || 24,
        last_run_at: (data as any)?.last_run_at || null,
        is_running: Boolean((data as any)?.is_running),
        enabled_sources: Array.isArray((data as any)?.enabled_sources) 
          ? (data as any).enabled_sources 
          : DEFAULT_SCRAPER_SETTINGS.enabled_sources || [],
        custom_sources: Array.isArray((data as any)?.custom_sources)
          ? (data as any).custom_sources
          : DEFAULT_SCRAPER_SETTINGS.custom_sources || [],
        max_images_to_import: parseInt(String((data as any)?.max_images_to_import || 50)),
        created_at: (data as any)?.created_at || new Date().toISOString(),
        updated_at: (data as any)?.updated_at || new Date().toISOString()
      } as ScraperSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraper-settings'] });
      toast({
        title: "Settings Updated",
        description: "Scraper settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutation to import historical events
  const importEventsMutation = useMutation({
    mutationFn: async () => {
      return await importHistoricalEvents();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['historical-events'] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.results?.filter(r => r.status === 'success').length || 0} historical events.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: `Failed to import events: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Return all the necessary data and functions
  return {
    events,
    isLoadingEvents,
    refetchEvents,
    scraperLogs,
    isLoadingLogs,
    refetchLogs,
    scraperSettings,
    isLoadingSettings,
    refetchSettings,
    bulkUpdateEventsMutation,
    updateSettingsMutation,
    importEventsMutation
  };
};
