
import { supabase } from '@/integrations/supabase/client';

export async function searchWikimediaImages(searchQuery: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('wikimedia-search', {
      body: { searchQuery }
    });

    if (error) {
      console.error('Error fetching Wikimedia images:', error);
      return null;
    }

    if (data.images && data.images.length > 0) {
      // Filter out SVG images and get the first valid image
      const validImage = data.images.find(img => 
        !img.url.toLowerCase().endsWith('.svg') &&
        !img.title.toLowerCase().includes('logo') &&
        !img.title.toLowerCase().includes('icon')
      );

      return validImage?.url || null;
    }

    return null;
  } catch (error) {
    console.error('Error in searchWikimediaImages:', error);
    return null;
  }
}
