
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 10,
  requestsPerHour: 100,
};

// In-memory cache for rate limiting
const rateLimitCache = {
  requests: [] as number[],
};

// Image validation cache to avoid repeated validations
const imageValidationCache = new Map<string, {
  valid: boolean,
  timestamp: number,
  alternativeUrl?: string
}>();

// Check if a URL exists and is accessible
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    if (!url) return false;
    
    // Check cache first
    if (imageValidationCache.has(url)) {
      const cached = imageValidationCache.get(url)!;
      // Cache valid for 24 hours
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        console.log(`Using cached validation for ${url}: ${cached.valid}`);
        return cached.valid;
      }
    }
    
    console.log(`Verifying image URL: ${url}`);
    const response = await fetch(url, { method: 'HEAD' });
    const valid = response.status === 200;
    
    // Update cache
    imageValidationCache.set(url, { valid, timestamp: Date.now() });
    return valid;
  } catch (error) {
    console.error(`Error verifying image URL ${url}:`, error);
    // Cache failures too
    imageValidationCache.set(url, { valid: false, timestamp: Date.now() });
    return false;
  }
}

// Fetch a better image from Wikimedia Commons
async function fetchWikimediaImage(searchTerm: string) {
  try {
    console.log(`Searching for better image: ${searchTerm}`);
    
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      console.error(`No images found for query: ${searchTerm}`);
      return null;
    }
    
    // Get the first search result that looks like a photo (not SVG, PDF, etc.)
    let selectedFile = null;
    for (const result of searchData.query.search) {
      const fileName = result.title.replace('File:', '');
      if (!/\.(svg|pdf|ogg|mid|txt)$/i.test(fileName)) {
        selectedFile = fileName;
        break;
      }
    }
    
    if (!selectedFile) {
      // If no suitable image was found, use the first result anyway
      selectedFile = searchData.query.search[0].title.replace('File:', '');
    }
    
    console.log(`Selected image: ${selectedFile}`);
    
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(selectedFile)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();
    
    const pages = infoData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || !pages[pageId]?.imageinfo?.length) {
      console.error(`No image info found for file: ${selectedFile}`);
      return null;
    }
    
    const imageInfo = pages[pageId].imageinfo[0];
    
    return imageInfo.url;
  } catch (error) {
    console.error(`Error fetching Wikimedia image for ${searchTerm}:`, error);
    return null;
  }
}

// Fetch a fallback image from Unsplash API
async function fetchUnsplashImage(query: string): Promise<string | null> {
  try {
    // Use Unsplash API without requiring authentication for demo purposes
    // In production, you would use the Unsplash API with proper authentication
    const accessKey = "demo-access-key";
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${accessKey}`;
    
    // For demo, just return a placeholder URL since we don't have real Unsplash credentials
    console.log(`Would fetch Unsplash image for: ${query} (demo)`);
    
    // Instead of making a real API call, return a placeholder
    return `https://source.unsplash.com/random?${encodeURIComponent(query)}`;
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
}

// Check if we're being rate limited
function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Remove old requests from cache
  rateLimitCache.requests = rateLimitCache.requests.filter(time => now - time < 60 * 60 * 1000);
  
  // Check hourly limit
  if (rateLimitCache.requests.length >= RATE_LIMIT.requestsPerHour) {
    return false;
  }
  
  // Check per-minute limit
  const requestsLastMinute = rateLimitCache.requests.filter(time => now - time < 60 * 1000);
  if (requestsLastMinute.length >= RATE_LIMIT.requestsPerMinute) {
    return false;
  }
  
  // Record this request
  rateLimitCache.requests.push(now);
  return true;
}

// Main function to handle image validation and fallback
async function validateAndFixEventImage(supabase: any, eventId: string) {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return {
        success: false,
        message: "Rate limit exceeded. Please try again later."
      };
    }
    
    // Get the event details
    const { data: event, error: eventError } = await supabase
      .from('historical_events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      console.error("Error fetching event:", eventError);
      return {
        success: false,
        message: `Failed to fetch event: ${eventError.message}`
      };
    }
    
    if (!event) {
      return {
        success: false,
        message: "Event not found"
      };
    }
    
    console.log(`Validating image for event: ${event.year} - ${event.description.substring(0, 30)}...`);
    
    // First, verify if the current image URL is valid
    if (event.image_url) {
      const isValid = await verifyImageUrl(event.image_url);
      if (isValid) {
        console.log("Current image URL is valid:", event.image_url);
        return {
          success: true,
          message: "Image URL is valid"
        };
      }
      console.log("Current image URL is invalid, searching for alternatives");
    } else {
      console.log("Event has no image URL, searching for alternatives");
    }
    
    // Try to find a better image from Wikimedia Commons
    const searchTerm = `${event.year} ${event.description.split(' ').slice(0, 5).join(' ')}`;
    const newImageUrl = await fetchWikimediaImage(searchTerm);
    
    if (newImageUrl) {
      // Verify the new image URL
      const isNewImageValid = await verifyImageUrl(newImageUrl);
      if (isNewImageValid) {
        // Update the event with the new image URL
        const { error: updateError } = await supabase
          .from('historical_events')
          .update({ 
            image_url: newImageUrl,
            image_attribution: 'Wikimedia Commons',
            image_license: 'Various'
          })
          .eq('id', eventId);
          
        if (updateError) {
          console.error("Error updating event with new image:", updateError);
          return {
            success: false,
            message: `Failed to update event with new image: ${updateError.message}`,
            newImageUrl
          };
        }
        
        console.log("Successfully updated event with new image URL:", newImageUrl);
        return {
          success: true,
          message: "Found and updated with new image from Wikimedia",
          newImageUrl
        };
      }
      console.log("New Wikimedia image URL is also invalid, trying Unsplash");
    }
    
    // If Wikimedia fails, try Unsplash
    const unsplashQuery = `historical ${event.year} ${event.location_name}`;
    const unsplashImageUrl = await fetchUnsplashImage(unsplashQuery);
    
    if (unsplashImageUrl) {
      // Update the event with the Unsplash image URL
      const { error: updateError } = await supabase
        .from('historical_events')
        .update({ 
          image_url: unsplashImageUrl,
          image_attribution: 'Unsplash',
          image_license: 'Unsplash License'
        })
        .eq('id', eventId);
        
      if (updateError) {
        console.error("Error updating event with Unsplash image:", updateError);
        return {
          success: false,
          message: `Failed to update event with Unsplash image: ${updateError.message}`,
          newImageUrl: unsplashImageUrl
        };
      }
      
      console.log("Successfully updated event with Unsplash image URL:", unsplashImageUrl);
      return {
        success: true,
        message: "Found and updated with fallback image from Unsplash",
        newImageUrl: unsplashImageUrl
      };
    }
    
    return {
      success: false,
      message: "Failed to find any valid replacement image"
    };
  } catch (error) {
    console.error("Error in validateAndFixEventImage:", error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only POST method is allowed
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get admin credentials from environment
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    
    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseAdminKey);
    
    // Get request body
    const { eventId } = await req.json();
    
    if (!eventId) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "Event ID is required"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate and fix the event image
    const result = await validateAndFixEventImage(supabase, eventId);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in validate-event-image function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
