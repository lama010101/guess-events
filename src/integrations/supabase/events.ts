
import { supabase } from './client';
import type { HistoricalEvent } from '@/types/game';

/**
 * Fetches all historical events from the database
 */
export const fetchAllHistoricalEvents = async (): Promise<HistoricalEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching historical events:', error);
      throw error;
    }

    if (!data) return [];

    // Convert database format to application format
    return data.map(event => ({
      id: event.id,
      year: event.year,
      description: event.description,
      imageUrl: event.image_url,
      location: {
        name: event.location_name,
        lat: Number(event.latitude),
        lng: Number(event.longitude)
      }
    }));
  } catch (error) {
    console.error('Error fetching historical events:', error);
    return [];
  }
};

/**
 * Fetches a random set of historical events from the database
 * @param limit - Maximum number of events to return
 */
export const fetchRandomHistoricalEvents = async (limit: number = 5): Promise<HistoricalEvent[]> => {
  try {
    // First check if we have any events
    const { count, error: countError } = await supabase
      .from('historical_events')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting historical events:', countError);
      throw countError;
    }
    
    // If we don't have any events, return empty array
    if (count === 0) {
      console.log('No historical events found in database. Please import some events first.');
      
      // Attempt to auto-import events
      try {
        console.log('Attempting to auto-import events...');
        const { error: importError } = await supabase.functions.invoke('import-historical-events');
        if (importError) {
          console.error('Auto-import failed:', importError);
        } else {
          console.log('Auto-import successful, retrying fetch');
          // Retry the fetch after import
          const { data: freshData } = await supabase
            .from('historical_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
            
          if (freshData && freshData.length > 0) {
            return freshData.map(event => ({
              id: event.id,
              year: event.year,
              description: event.description,
              imageUrl: event.image_url,
              location: {
                name: event.location_name,
                lat: Number(event.latitude),
                lng: Number(event.longitude)
              }
            }));
          }
        }
      } catch (autoImportError) {
        console.error('Error during auto-import:', autoImportError);
      }
      
      return [];
    }
    
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching random historical events:', error);
      throw error;
    }

    if (!data) return [];

    // Convert database format to application format
    return data.map(event => ({
      id: event.id,
      year: event.year,
      description: event.description,
      imageUrl: event.image_url,
      location: {
        name: event.location_name,
        lat: Number(event.latitude),
        lng: Number(event.longitude)
      }
    }));
  } catch (error) {
    console.error('Error fetching random historical events:', error);
    return [];
  }
};

/**
 * Checks if there are any historical events in the database
 * @returns Boolean indicating if events exist
 */
export const hasHistoricalEvents = async (): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('historical_events')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking for historical events:', error);
      throw error;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Error checking for historical events:', error);
    return false;
  }
};
