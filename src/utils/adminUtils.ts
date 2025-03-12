
import { supabase } from '@/integrations/supabase/client';
import { searchWikimediaImages } from './imageUtils';

export async function updateEventWithWikimediaImage(
  eventId: string, 
  description: string, 
  year: number
): Promise<boolean> {
  try {
    // Construct a search query that includes both the event description and year
    const searchQuery = `${description} ${year}`;
    const imageUrl = await searchWikimediaImages(searchQuery);

    if (!imageUrl) {
      console.error('No suitable image found for:', searchQuery);
      return false;
    }

    // Update the event with the new image URL
    const { error } = await supabase
      .from('historical_events')
      .update({ image_url: imageUrl })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateEventWithWikimediaImage:', error);
    return false;
  }
}
