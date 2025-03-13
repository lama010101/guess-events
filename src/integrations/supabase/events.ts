
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

    if (error) throw error;

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
    
    if (countError) throw countError;
    
    // If we don't have any events, return empty array
    if (count === 0) {
      console.log('No historical events found in database. Please import some events first.');
      return [];
    }
    
    // If we have less events than the limit, just return all events in random order
    if (count <= limit) {
      const { data, error } = await supabase
        .from('historical_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

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
    }
    
    // If we have more events than the limit, select random events
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
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
    
    if (error) throw error;
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Error checking for historical events:', error);
    return false;
  }
};

/**
 * Verifies that all historical events have images
 * @returns Object containing verification results
 */
export const verifyHistoricalEventImages = async (): Promise<{
  valid: boolean;
  eventsCount: number;
  eventsWithoutImages: number;
}> => {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('historical_events')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    if (count === 0) {
      return { valid: false, eventsCount: 0, eventsWithoutImages: 0 };
    }
    
    // Count events without images
    const { count: missingImagesCount, error: missingImagesError } = await supabase
      .from('historical_events')
      .select('*', { count: 'exact', head: true })
      .is('image_url', null);
    
    if (missingImagesError) throw missingImagesError;
    
    return {
      valid: missingImagesCount === 0,
      eventsCount: count ?? 0,
      eventsWithoutImages: missingImagesCount ?? 0
    };
  } catch (error) {
    console.error('Error verifying historical event images:', error);
    return { valid: false, eventsCount: 0, eventsWithoutImages: 0 };
  }
};
