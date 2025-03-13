
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

// Function to fetch image information from Wikimedia API
async function fetchWikimediaImage(title: string) {
  try {
    // First search for the image to get the exact file name
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&srnamespace=6&format=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      console.error(`No images found for query: ${title}`);
      return null;
    }
    
    // Get the first search result's title
    const fileName = searchData.query.search[0].title.replace('File:', '');
    
    // Now get the image info with the URL
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
    console.error(`Error fetching Wikimedia image for ${title}:`, error);
    return null;
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
    
    const importResults = [];
    
    // Process each historical event
    for (const event of historicalEvents) {
      // Fetch appropriate image from Wikimedia
      const imageInfo = await fetchWikimediaImage(event.image_title);
      
      if (!imageInfo) {
        importResults.push({
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          status: 'failed',
          error: 'Could not find suitable image'
        });
        continue;
      }
      
      // Insert into Supabase database
      const { data, error } = await supabase
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
        .select()
        .single();
      
      if (error) {
        importResults.push({
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          status: 'failed',
          error: error.message
        });
        continue;
      }
      
      importResults.push({
        year: event.year,
        description: event.description.substring(0, 30) + '...',
        status: 'success',
        id: data.id
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Imported ${importResults.filter(r => r.status === 'success').length} historical events successfully`,
      results: importResults
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
