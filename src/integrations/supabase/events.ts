
import { supabase } from './client';
import type { HistoricalEvent } from '@/types/game';
import { HistoricalEventDB } from '@/types/scraper';

/**
 * Fetches all historical events from the database
 */
export const fetchAllHistoricalEvents = async (): Promise<HistoricalEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .eq('deleted', false)
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
    // First, count total available events
    const { count, error: countError } = await supabase
      .from('historical_events')
      .select('*', { count: 'exact', head: true })
      .eq('deleted', false)
      .not('image_url', 'is', null); // Ensure we have images
    
    if (countError) throw countError;
    
    if (!count || count === 0) {
      console.warn('No historical events found in database');
      return [];
    }
    
    // Fetch random events with images and valid coordinates
    const { data, error } = await supabase
      .from('historical_events')
      .select('*')
      .eq('deleted', false)
      .not('image_url', 'is', null) // Ensure image exists
      .not('latitude', 'is', null) // Ensure latitude exists
      .not('longitude', 'is', null) // Ensure longitude exists
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn('No valid historical events found with images and coordinates');
      return [];
    }

    // Convert database format to application format - avoid explicit type annotation
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
 * Runs the web scraper to collect historical events
 * @param sourceNames - Optional list of source names to scrape
 */
export const runWebScraper = async (sourceNames?: string[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-historical-events', {
      body: { sourcesToScrape: sourceNames }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error running web scraper:', error);
    throw error;
  }
};

/**
 * Imports the initial set of historical events with images
 */
export const importHistoricalEvents = async () => {
  try {
    console.log('Attempting to import historical events...');
    const { data, error } = await supabase.functions.invoke('import-historical-events');
    
    if (error) {
      console.error('Error from import-historical-events function:', error);
      throw error;
    }
    
    console.log('Historical events imported successfully:', data);
    return data;
  } catch (error) {
    console.error('Error importing historical events:', error);
    throw error;
  }
};
