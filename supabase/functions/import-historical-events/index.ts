
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Historical events to import with detailed information
const historicalEvents = [
  {
    year: 1945,
    description: "Raising the Flag on Iwo Jima - American soldiers raise the U.S. flag on Mount Suribachi during the Battle of Iwo Jima in World War II.",
    location_name: "Iwo Jima, Japan",
    latitude: 24.7580,
    longitude: 141.2917,
    image_title: "Raising the Flag on Iwo Jima"
  },
  {
    year: 1963,
    description: "Martin Luther King Jr. delivers his famous 'I Have a Dream' speech during the March on Washington for Jobs and Freedom, advocating for civil rights and an end to racism.",
    location_name: "Lincoln Memorial, Washington D.C., USA",
    latitude: 38.8893,
    longitude: -77.0502,
    image_title: "Martin Luther King Jr. I Have a Dream"
  },
  {
    year: 1969,
    description: "Apollo 11 Mission - Neil Armstrong becomes the first human to step on the surface of the Moon, marking a historic achievement in space exploration.",
    location_name: "Sea of Tranquility, Moon",
    latitude: 0.6744,
    longitude: 23.4322,
    image_title: "Apollo 11 first step on Moon"
  },
  {
    year: 1989,
    description: "Fall of the Berlin Wall - Citizens began dismantling the Berlin Wall, symbolizing the end of the Cold War and the reunification of East and West Germany.",
    location_name: "Berlin, Germany",
    latitude: 52.5163,
    longitude: 13.3777,
    image_title: "Berlin Wall fall 1989"
  },
  {
    year: 1955,
    description: "Rosa Parks refuses to give up her seat on a bus in Montgomery, Alabama, becoming a symbol of the Civil Rights Movement and sparking the Montgomery Bus Boycott.",
    location_name: "Montgomery, Alabama, USA",
    latitude: 32.3792,
    longitude: -86.3077,
    image_title: "Rosa Parks bus photo"
  },
  {
    year: 1912,
    description: "The RMS Titanic sinks in the North Atlantic Ocean after colliding with an iceberg during her maiden voyage, resulting in the deaths of more than 1,500 passengers and crew.",
    location_name: "North Atlantic Ocean",
    latitude: 41.7260,
    longitude: -49.9477,
    image_title: "RMS Titanic leaving Southampton"
  },
  {
    year: 1941,
    description: "Attack on Pearl Harbor - Japan launches a surprise military strike on the United States naval base at Pearl Harbor, leading to America's entry into World War II.",
    location_name: "Pearl Harbor, Hawaii, USA",
    latitude: 21.3645,
    longitude: -157.9762,
    image_title: "Attack on Pearl Harbor"
  },
  {
    year: 1986,
    description: "Chernobyl Disaster - A catastrophic nuclear accident occurs at the Chernobyl Nuclear Power Plant, releasing radioactive particles into the atmosphere and causing widespread environmental contamination.",
    location_name: "Pripyat, Ukraine (formerly USSR)",
    latitude: 51.3890,
    longitude: 30.0978,
    image_title: "Chernobyl Nuclear Power Plant"
  },
  {
    year: 2001,
    description: "September 11 attacks - Terrorists hijack four passenger airplanes, crashing two into the World Trade Center in New York City, one into the Pentagon, and one in a field in Pennsylvania.",
    location_name: "New York City, New York, USA",
    latitude: 40.7115,
    longitude: -74.0134,
    image_title: "September 11 attacks"
  },
  {
    year: 1776,
    description: "The United States Declaration of Independence is adopted by the Continental Congress, announcing the colonies' separation from Great Britain and establishing the United States of America.",
    location_name: "Philadelphia, Pennsylvania, USA",
    latitude: 39.9483,
    longitude: -75.1678,
    image_title: "United States Declaration of Independence"
  }
];

// Improved function to fetch image from Wikimedia using the Stack Overflow approach
async function fetchWikimediaImage(title: string, year: number) {
  console.log(`Attempting to fetch image for "${title}" (${year}) using improved method`);
  
  try {
    // Step 1: First search for relevant images in Wikimedia Commons
    const searchTerm = encodeURIComponent(`${title} ${year}`);
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${searchTerm}&srnamespace=6&format=json`;
    
    console.log(`Searching Wikimedia Commons with URL: ${searchUrl}`);
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Search request failed with status ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search || searchData.query.search.length === 0) {
      console.log(`No search results found for "${title}". Trying alternative search...`);
      
      // Try an alternative search with just the title
      const altSearchTerm = encodeURIComponent(title);
      const altSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${altSearchTerm}&srnamespace=6&format=json`;
      
      const altSearchResponse = await fetch(altSearchUrl);
      if (!altSearchResponse.ok) {
        throw new Error(`Alternative search request failed with status ${altSearchResponse.status}`);
      }
      
      const altSearchData = await altSearchResponse.json();
      
      if (!altSearchData.query?.search || altSearchData.query.search.length === 0) {
        console.log(`No results found in alternative search for "${title}"`);
        return null;
      }
      
      searchData.query = altSearchData.query;
    }
    
    // Get the first search result (most relevant)
    const firstResult = searchData.query.search[0];
    const imageName = firstResult.title.replace('File:', '');
    
    console.log(`Found image: ${imageName}`);
    
    // Step 2: Get image info and URL
    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    
    console.log(`Fetching image info with URL: ${imageInfoUrl}`);
    const imageInfoResponse = await fetch(imageInfoUrl);
    
    if (!imageInfoResponse.ok) {
      throw new Error(`Image info request failed with status ${imageInfoResponse.status}`);
    }
    
    const imageInfoData = await imageInfoResponse.json();
    const pages = imageInfoData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || !pages[pageId]?.imageinfo || pages[pageId].imageinfo.length === 0) {
      console.log(`No image info found for ${imageName}`);
      return null;
    }
    
    const imageInfo = pages[pageId].imageinfo[0];
    const metadata = imageInfo.extmetadata || {};
    
    console.log(`Successfully retrieved image URL: ${imageInfo.url}`);
    
    return {
      url: imageInfo.url,
      attribution: metadata.Artist?.value || 'Wikimedia Commons',
      license: metadata.License?.value || 'Unknown',
      title: imageName
    };
  } catch (error) {
    console.error(`Error fetching Wikimedia image for "${title}":`, error);
    return null;
  }
}

// Function to get existing event or create a new one
async function getOrCreateEvent(supabase: any, event: any, options: any = {}) {
  const { fixImages = false, forceRefresh = false } = options;
  
  try {
    // Check if event already exists
    const { data: existingEvents, error: findError } = await supabase
      .from('historical_events')
      .select('*')
      .eq('year', event.year)
      .eq('description', event.description);
    
    if (findError) {
      throw findError;
    }
    
    const existingEvent = existingEvents && existingEvents.length > 0 ? existingEvents[0] : null;
    
    // If event exists, check if it needs image fixing
    if (existingEvent) {
      console.log(`Event from ${event.year} already exists (ID: ${existingEvent.id})`);
      
      // If we don't need to fix images or force refresh, or the event already has an image, skip
      if ((!fixImages && !forceRefresh) || (existingEvent.image_url && !forceRefresh)) {
        return {
          status: 'skipped',
          id: existingEvent.id,
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          message: 'Event already exists'
        };
      }
      
      // If we need to fix the image or force refresh, proceed to update
      console.log(`Updating image for event from ${event.year} (ID: ${existingEvent.id})`);
      
      // Fetch appropriate image from Wikimedia using improved method
      const imageInfo = await fetchWikimediaImage(event.image_title, event.year);
      
      if (!imageInfo) {
        return {
          status: 'failed',
          id: existingEvent.id,
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          error: 'Could not find suitable image'
        };
      }
      
      // Update the event with new image info
      const { error: updateError } = await supabase
        .from('historical_events')
        .update({
          image_url: imageInfo.url,
          image_attribution: imageInfo.attribution,
          image_license: imageInfo.license
        })
        .eq('id', existingEvent.id);
      
      if (updateError) {
        return {
          status: 'failed',
          id: existingEvent.id,
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          error: updateError.message
        };
      }
      
      return {
        status: 'success',
        id: existingEvent.id,
        year: event.year,
        description: event.description.substring(0, 30) + '...',
        message: 'Updated event image'
      };
    }
    
    // Event doesn't exist, create it
    console.log(`Creating new event for ${event.year}`);
    
    // Fetch appropriate image from Wikimedia using improved method
    const imageInfo = await fetchWikimediaImage(event.image_title, event.year);
    
    if (!imageInfo) {
      return {
        status: 'failed',
        year: event.year,
        description: event.description.substring(0, 30) + '...',
        error: 'Could not find suitable image'
      };
    }
    
    // Insert into Supabase database
    const { data, error: insertError } = await supabase
      .from('historical_events')
      .insert({
        year: event.year,
        description: event.description,
        location_name: event.location_name,
        latitude: event.latitude,
        longitude: event.longitude,
        image_url: imageInfo.url,
        image_attribution: imageInfo.attribution,
        image_license: imageInfo.license
      })
      .select();
    
    if (insertError) {
      return {
        status: 'failed',
        year: event.year,
        description: event.description.substring(0, 30) + '...',
        error: insertError.message
      };
    }
    
    const newEvent = data[0];
    
    return {
      status: 'success',
      id: newEvent.id,
      year: event.year,
      description: event.description.substring(0, 30) + '...',
      message: 'Created new event'
    };
    
  } catch (error) {
    console.error(`Error processing event from ${event.year}:`, error);
    
    return {
      status: 'failed',
      year: event.year,
      description: event.description.substring(0, 30) + '...',
      error: error.message
    };
  }
}

// Function to check and fix events without images
async function fixEventsWithoutImages(supabase: any) {
  try {
    // Find events without images
    const { data: eventsWithoutImages, error: findError } = await supabase
      .from('historical_events')
      .select('*')
      .is('image_url', null);
    
    if (findError) {
      throw findError;
    }
    
    console.log(`Found ${eventsWithoutImages.length} events without images`);
    
    if (!eventsWithoutImages || eventsWithoutImages.length === 0) {
      return [];
    }
    
    const results = [];
    
    // Fix each event
    for (const event of eventsWithoutImages) {
      // Find the original event with image_title
      const originalEvent = historicalEvents.find(e => 
        e.year === event.year && e.description === event.description
      );
      
      if (!originalEvent) {
        results.push({
          status: 'failed',
          id: event.id,
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          error: 'Could not find original event data'
        });
        continue;
      }
      
      // Fetch image with improved method
      const imageInfo = await fetchWikimediaImage(originalEvent.image_title, event.year);
      
      if (!imageInfo) {
        results.push({
          status: 'failed',
          id: event.id,
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          error: 'Could not find suitable image'
        });
        continue;
      }
      
      // Update the event
      const { error: updateError } = await supabase
        .from('historical_events')
        .update({
          image_url: imageInfo.url,
          image_attribution: imageInfo.attribution,
          image_license: imageInfo.license
        })
        .eq('id', event.id);
      
      if (updateError) {
        results.push({
          status: 'failed',
          id: event.id,
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          error: updateError.message
        });
        continue;
      }
      
      results.push({
        status: 'success',
        id: event.id,
        year: event.year,
        description: event.description.substring(0, 30) + '...',
        message: 'Fixed missing image'
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error fixing events without images:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    let options = {};
    if (req.method === 'POST') {
      try {
        options = await req.json();
      } catch (e) {
        options = {};
      }
    }
    
    console.log("Starting historical events import with options:", options);
    
    // Get admin credentials from environment
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    
    if (!supabaseAdminKey || !supabaseUrl) {
      throw new Error('Missing Supabase credentials');
    }
    
    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseAdminKey);
    
    let results = [];
    
    // Handle fixing events without images
    if (options.fixImages) {
      console.log("Fixing events without images");
      results = await fixEventsWithoutImages(supabase);
    } else {
      // Process each historical event
      console.log(`Processing ${historicalEvents.length} historical events`);
      
      for (const event of historicalEvents) {
        const result = await getOrCreateEvent(supabase, event, options);
        results.push(result);
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    console.log(`Import summary: ${successCount} successful, ${failedCount} failed, ${skippedCount} skipped`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${results.length} historical events: ${successCount} successful, ${failedCount} failed, ${skippedCount} skipped`,
      results: results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in import-historical-events function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
