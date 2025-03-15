
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { importHistoricalEvents } from '@/integrations/supabase/events';

export const useAutoImport = () => {
  const { toast } = useToast();
  const [isAutoImportComplete, setIsAutoImportComplete] = useState(false);
  const [isAutoImportRunning, setIsAutoImportRunning] = useState(false);
  const [importedEvents, setImportedEvents] = useState<any[]>([]);

  useEffect(() => {
    const checkIfEventsExist = async () => {
      try {
        const { count, error } = await supabase
          .from('historical_events')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        // If no events exist, trigger the auto-import
        if (count === 0 && !isAutoImportRunning && !isAutoImportComplete) {
          triggerAutoImport();
        } else {
          setIsAutoImportComplete(true);
        }
      } catch (error) {
        console.error('Error checking if events exist:', error);
      }
    };

    checkIfEventsExist();
  }, []);

  const triggerAutoImport = async () => {
    try {
      setIsAutoImportRunning(true);
      
      toast({
        title: "Auto-import Started",
        description: "Automatically importing initial historical events...",
      });

      const result = await importHistoricalEvents();
      
      if (!result) throw new Error("Import failed");
      
      const successCount = result.results?.filter((r: any) => r.status === 'success').length || 0;
      
      // Get the imported events to display them
      const { data: eventsData } = await supabase
        .from('historical_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (eventsData) {
        setImportedEvents(eventsData);
      }
      
      toast({
        title: "Auto-import Completed",
        description: `Successfully imported ${successCount} historical events.`,
      });
      
      setIsAutoImportComplete(true);
    } catch (error: any) {
      console.error('Error during auto-import:', error);
      toast({
        title: "Auto-import Failed",
        description: `Failed to import events: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsAutoImportRunning(false);
    }
  };

  return {
    isAutoImportComplete,
    isAutoImportRunning,
    importedEvents
  };
};
