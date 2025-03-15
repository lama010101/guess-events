
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { HistoricalEventDB, ScraperLog, ScraperSettings } from '@/types/scraper';

const DEFAULT_SCRAPER_SETTINGS: Partial<ScraperSettings> = {
  auto_run_interval: 24, // 24 hours
  is_running: false,
  enabled_sources: [
    "USA Today Historical Events",
    "Rare Historical Photos",
    "Demilked Historical Pics"
  ]
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
        
        // Parse the JSONB array result and properly transform to ScraperLog type
        if (Array.isArray(data)) {
          return data.map((item: any) => {
            // Ensure the item has all required properties of ScraperLog
            return {
              id: item?.id || '',
              created_at: item?.created_at || '',
              sources_processed: item?.sources_processed || 0,
              total_events_found: item?.total_events_found || 0,
              new_events_added: item?.new_events_added || 0,
              failures: item?.failures || 0,
              details: Array.isArray(item?.details) 
                ? item.details.map((detail: any) => ({
                    sourceName: detail?.sourceName || '',
                    eventsFound: detail?.eventsFound || 0,
                    newEvents: detail?.newEvents || 0,
                    existingEvents: detail?.existingEvents || 0,
                    status: detail?.status || '',
                    error: detail?.error || null
                  }))
                : []
            } as ScraperLog;
          });
        }
        return [] as ScraperLog[];
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
          // If no settings found, return default
          return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
        }
        
        // Parse the JSONB array result
        if (Array.isArray(data) && data.length > 0) {
          const settings = data[0] as any;
          return {
            id: settings?.id || 'default',
            auto_run_interval: settings?.auto_run_interval || 24,
            last_run_at: settings?.last_run_at || null,
            is_running: settings?.is_running || false,
            enabled_sources: Array.isArray(settings?.enabled_sources) 
              ? settings.enabled_sources 
              : DEFAULT_SCRAPER_SETTINGS.enabled_sources || [],
            created_at: settings?.created_at || new Date().toISOString(),
            updated_at: settings?.updated_at || new Date().toISOString()
          } as ScraperSettings;
        }
        
        return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
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
      
      // Parse the JSONB result
      if (data) {
        const result = data as any;
        return {
          id: result?.id || 'default',
          auto_run_interval: result?.auto_run_interval || 24,
          last_run_at: result?.last_run_at || null,
          is_running: result?.is_running || false,
          enabled_sources: Array.isArray(result?.enabled_sources) 
            ? result.enabled_sources 
            : DEFAULT_SCRAPER_SETTINGS.enabled_sources || [],
          created_at: result?.created_at || new Date().toISOString(),
          updated_at: result?.updated_at || new Date().toISOString()
        } as ScraperSettings;
      }
      
      return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
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
  };
};
