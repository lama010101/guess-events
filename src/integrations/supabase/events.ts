
import { supabase } from './client';
import type { HistoricalEvent } from '@/types/game';

/**
 * Fetches all historical events from the database
 */
export const fetchAllHistoricalEvents = async (): Promise<HistoricalEvent[]> => {
  try {
    console.log('Fetching all historical events...');
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching historical events:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} historical events`);
    
    if (!data || data.length === 0) {
      console.log('No historical events found, attempting auto-import...');
      try {
        // Call the advanced import function with batch settings
        const { error: importError } = await supabase.functions.invoke('import-historical-events', {
          body: { 
            batchSize: 100,
            validateImages: true,
            confidenceThreshold: 0.85
          }
        });
        
        if (importError) {
          console.error('Auto-import failed:', importError);
        } else {
          console.log('Auto-import successful, refetching events...');
          // Retry the fetch after import
          const { data: freshData, error: refetchError } = await supabase
            .from('historical_events')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (refetchError) {
            console.error('Error refetching after import:', refetchError);
            return [];
          }
          
          if (freshData && freshData.length > 0) {
            console.log(`Successfully imported and fetched ${freshData.length} events`);
            return freshData.map(event => formatHistoricalEvent(event));
          }
        }
      } catch (autoImportError) {
        console.error('Error during auto-import:', autoImportError);
      }
    }

    // Convert database format to application format
    return data ? data.map(event => formatHistoricalEvent(event)) : [];
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
      console.log('No historical events found in database. Auto-importing events...');
      
      // Attempt to auto-import events with enhanced validation
      try {
        console.log('Attempting to auto-import events with AI validation...');
        const { error: importError } = await supabase.functions.invoke('import-historical-events', {
          body: { 
            batchSize: 100,
            validateImages: true,
            confidenceThreshold: 0.85
          }
        });
        
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
            return freshData.map(event => formatHistoricalEvent(event));
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
    return data.map(event => formatHistoricalEvent(event));
  } catch (error) {
    console.error('Error fetching random historical events:', error);
    return [];
  }
};

/**
 * Helper function to format database event to application event
 */
const formatHistoricalEvent = (event: any): HistoricalEvent => {
  return {
    id: event.id,
    year: event.year,
    description: event.description,
    imageUrl: event.image_url,
    location: {
      name: event.location_name,
      lat: Number(event.latitude),
      lng: Number(event.longitude)
    }
  };
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

/**
 * Validates an event's image using the enhanced AI-powered image validation edge function
 */
export const validateEventImage = async (eventId: string): Promise<{
  success: boolean, 
  message: string, 
  newImageUrl?: string,
  metadata?: {
    confidence: number,
    historicalContext?: string,
    keywords?: string[],
    temporalConsistency?: boolean
  }
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-event-image', {
      body: { 
        eventId,
        validateContent: true,
        useFallbackSources: true,
        confidenceThreshold: 0.85
      }
    });
    
    if (error) {
      console.error('Error validating event image:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error validating event image:', error);
    return { success: false, message: `Exception: ${error.message}` };
  }
};

/**
 * Batch imports and validates events with images
 * @param options Import options
 */
export const batchImportEvents = async (options: {
  batchSize?: number,
  validateImages?: boolean,
  confidenceThreshold?: number,
  source?: string
} = {}): Promise<{
  success: boolean,
  message: string,
  imported: number,
  failed: number,
  results?: any[]
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('import-historical-events', {
      body: { 
        batchSize: options.batchSize || 100,
        validateImages: options.validateImages !== false,
        confidenceThreshold: options.confidenceThreshold || 0.85,
        source: options.source || 'wikimedia'
      }
    });
    
    if (error) {
      console.error('Error in batch import:', error);
      return { 
        success: false, 
        message: `Error during batch import: ${error.message}`,
        imported: 0,
        failed: 0
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Exception in batch import:', error);
    return { 
      success: false, 
      message: `Exception during batch import: ${error.message}`,
      imported: 0,
      failed: 0
    };
  }
};
