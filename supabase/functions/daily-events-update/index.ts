
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to verify if an image URL is valid
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    console.error(`Error verifying image URL ${url}:`, error);
    return false;
  }
}

// Enhanced function to fetch image information from Wikimedia API
async function fetchWikimediaImage(searchTerm: string) {
  try {
    console.log(`Searching for image: ${searchTerm}`);
    
    // First do a search to find relevant images
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      console.error(`No images found for query: ${searchTerm}`);
      
      // Try a broader search by using fewer keywords
      const simplifiedSearch = searchTerm.split(' ').slice(0, 2).join(' ');
      console.log(`Trying simplified search: ${simplifiedSearch}`);
      
      const fallbackUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(simplifiedSearch)}&srnamespace=6&format=json`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      
      if (!fallbackData.query?.search?.length) {
        console.error(`No images found for simplified query either: ${simplifiedSearch}`);
        return null;
      }
      
      // Use the first result from the simplified search
      const fileName = fallbackData.query.search[0].title.replace('File:', '');
      console.log(`Found image with simplified search: ${fileName}`);
      
      // Now get the image info
      return await getImageDetails(fileName);
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
    
    // Get the image details
    return await getImageDetails(selectedFile);
    
  } catch (error) {
    console.error(`Error fetching Wikimedia image for ${searchTerm}:`, error);
    return null;
  }
}

// Helper function to get image details once we have a filename
async function getImageDetails(fileName: string) {
  try {
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();
    
    const pages = infoData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || !pages[pageId]?.imageinfo?.length) {
      console.error(`No image info found for file: ${fileName}`);
      return null;
    }
    
    const imageInfo = pages[pageId].imageinfo[0];
    const metadata = imageInfo.extmetadata || {};
    
    return {
      url: imageInfo.url,
      attribution: metadata.Artist?.value || 'Wikimedia Commons',
      license: metadata.License?.value || 'Unknown',
      title: fileName
    };
  } catch (error) {
    console.error(`Error getting image details for ${fileName}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Accept GET or POST
  if (req.method !== 'POST' && req.method !== 'GET') {
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
    
    let forceRefresh = false;
    
    // Parse request body if POST
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        forceRefresh = body.forceRefresh === true;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    console.log(`Daily events update running with forceRefresh=${forceRefresh}`);
    
    // Fetch all events
    const { data: events, error: fetchError } = await supabase
      .from('historical_events')
      .select('*');
    
    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }
    
    console.log(`Found ${events.length} events to check`);
    
    const results = {
      totalEvents: events.length,
      checkedImages: 0,
      validImages: 0,
      fixedImages: 0,
      failedToFix: 0,
      details: [] as any[]
    };
    
    // Check each event's image
    for (const event of events) {
      console.log(`Checking event ${event.id}: ${event.year} - ${event.description.substring(0, 30)}...`);
      
      const detail = {
        id: event.id,
        year: event.year,
        description: event.description.substring(0, 30) + "...",
        originalImage: event.image_url,
        status: "valid"
      };
      
      results.checkedImages++;
      
      // Skip image verification if no URL or if not forcing refresh and image was already checked
      if (!event.image_url) {
        detail.status = "missing";
        
        // Try to fix missing image
        console.log(`Fixing missing image for event ${event.id}`);
        const searchTerm = `${event.year} ${event.location_name} ${event.description.split(' ').slice(0, 5).join(' ')}`;
        const imageInfo = await fetchWikimediaImage(searchTerm);
        
        if (imageInfo && await verifyImageUrl(imageInfo.url)) {
          // Update the event with new image
          const { error: updateError } = await supabase
            .from('historical_events')
            .update({
              image_url: imageInfo.url,
              image_attribution: imageInfo.attribution,
              image_license: imageInfo.license
            })
            .eq('id', event.id);
          
          if (updateError) {
            detail.status = "fix_failed";
            detail.error = updateError.message;
            results.failedToFix++;
          } else {
            detail.status = "fixed";
            detail.newImage = imageInfo.url;
            results.fixedImages++;
          }
        } else {
          detail.status = "fix_failed";
          detail.error = "Could not find replacement image";
          results.failedToFix++;
        }
      } else {
        // Verify existing image
        const isValid = await verifyImageUrl(event.image_url);
        
        if (isValid) {
          results.validImages++;
        } else if (forceRefresh) {
          detail.status = "invalid";
          
          // Try to fix invalid image
          console.log(`Fixing invalid image for event ${event.id}`);
          const searchTerm = `${event.year} ${event.location_name} ${event.description.split(' ').slice(0, 5).join(' ')}`;
          const imageInfo = await fetchWikimediaImage(searchTerm);
          
          if (imageInfo && await verifyImageUrl(imageInfo.url)) {
            // Update the event with new image
            const { error: updateError } = await supabase
              .from('historical_events')
              .update({
                image_url: imageInfo.url,
                image_attribution: imageInfo.attribution,
                image_license: imageInfo.license
              })
              .eq('id', event.id);
            
            if (updateError) {
              detail.status = "fix_failed";
              detail.error = updateError.message;
              results.failedToFix++;
            } else {
              detail.status = "fixed";
              detail.newImage = imageInfo.url;
              results.fixedImages++;
            }
          } else {
            detail.status = "fix_failed";
            detail.error = "Could not find replacement image";
            results.failedToFix++;
          }
        }
      }
      
      results.details.push(detail);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Checked ${results.checkedImages} events, found ${results.validImages} valid images, fixed ${results.fixedImages} images, failed to fix ${results.failedToFix} images`,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in daily-events-update function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
