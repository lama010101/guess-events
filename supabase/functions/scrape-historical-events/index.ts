
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sources to scrape
const SCRAPE_SOURCES = [
  {
    name: "USA Today Historical Events",
    url: "https://www.usatoday.com/picture-gallery/life/2020/09/06/the-worlds-most-important-event-every-year-since-1920/42346845/",
    selector: ".gnt_ar_b", // Main article body
    imageSelector: ".slide img", // Slide images
    parser: "usaToday"
  },
  {
    name: "Rare Historical Photos",
    url: "https://rarehistoricalphotos.com/100-influential-historical-pictures-all-time/",
    selector: ".entry-content",
    imageSelector: ".entry-content img",
    parser: "rareHistoricalPhotos"
  },
  {
    name: "Demilked Historical Pics",
    url: "https://www.demilked.com/interesting-historical-pics/",
    selector: ".article-content",
    imageSelector: ".article-content img",
    parser: "demilked"
  }
];

// Parse different source formats
const parsers = {
  usaToday: async (html: string, source: any) => {
    const events = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    if (!doc) return [];
    
    // Extract slide content
    const slides = doc.querySelectorAll(".slide");
    
    for (const slide of slides) {
      const title = slide.querySelector("h2")?.textContent || "";
      const description = slide.querySelector("p")?.textContent || "";
      const imgElement = slide.querySelector("img");
      const imageUrl = imgElement?.getAttribute("src") || imgElement?.getAttribute("data-src") || "";
      
      // Extract year from title or description
      let eventYear = new Date().getFullYear();
      const yearMatch = title.match(/\b(19|20)\d{2}\b/) || description.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        eventYear = parseInt(yearMatch[0]);
      }
      
      if (title && description && imageUrl) {
        events.push({
          title,
          description,
          image_url: imageUrl,
          event_date: `${eventYear}-01-01`, // Default to January 1st of the year
          source_name: source.name,
          source_url: source.url
        });
      }
    }
    
    return events;
  },
  
  rareHistoricalPhotos: async (html: string, source: any) => {
    const events = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    if (!doc) return [];
    
    const content = doc.querySelector(".entry-content");
    if (!content) return [];
    
    const paragraphs = content.querySelectorAll("p");
    const images = content.querySelectorAll("img");
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const nearbyParagraph = paragraphs[i] || paragraphs[i-1] || paragraphs[i+1];
      
      if (!nearbyParagraph) continue;
      
      const imageUrl = img.getAttribute("src") || "";
      const description = nearbyParagraph.textContent || "";
      
      // Extract year from the description
      const yearMatch = description.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
      const eventYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
      
      // Generate title from description
      const title = description.split('.')[0] || "Historical Event";
      
      if (imageUrl && description) {
        events.push({
          title,
          description,
          image_url: imageUrl,
          event_date: `${eventYear}-01-01`,
          source_name: source.name,
          source_url: source.url
        });
      }
    }
    
    return events;
  },
  
  demilked: async (html: string, source: any) => {
    const events = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    if (!doc) return [];
    
    const content = doc.querySelector(".article-content");
    if (!content) return [];
    
    const images = content.querySelectorAll("img");
    const headings = content.querySelectorAll("h2, h3");
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const heading = headings[i] || null;
      
      const imageUrl = img.getAttribute("src") || img.getAttribute("data-src") || "";
      const title = heading ? heading.textContent : img.getAttribute("alt") || "Historical Event";
      const description = img.getAttribute("alt") || title;
      
      // Extract year from title or description
      const yearMatch = title.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/) || 
                        description.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
      const eventYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
      
      if (imageUrl && (title || description)) {
        events.push({
          title,
          description,
          image_url: imageUrl,
          event_date: `${eventYear}-01-01`,
          source_name: source.name,
          source_url: source.url
        });
      }
    }
    
    return events;
  }
};

// Helper function to extract location from event description using simple heuristics
function extractLocation(description: string): { latitude: number | null, longitude: number | null } {
  // Default to null coordinates
  let latitude = null;
  let longitude = null;
  
  // Common locations with approximate coordinates
  const commonLocations: Record<string, [number, number]> = {
    "new york": [40.7128, -74.0060],
    "london": [51.5074, -0.1278],
    "paris": [48.8566, 2.3522],
    "tokyo": [35.6762, 139.6503],
    "berlin": [52.5200, 13.4050],
    "rome": [41.9028, 12.4964],
    "moscow": [55.7558, 37.6173],
    "los angeles": [34.0522, -118.2437],
    "chicago": [41.8781, -87.6298],
    "washington": [38.9072, -77.0369],
    "washington dc": [38.9072, -77.0369],
    "san francisco": [37.7749, -122.4194],
    "beijing": [39.9042, 116.4074],
    "sydney": [33.8688, 151.2093],
    "rio de janeiro": [-22.9068, -43.1729],
    "cairo": [30.0444, 31.2357],
    "jerusalem": [31.7683, 35.2137]
  };
  
  // Check if any known location is mentioned in the description
  const lowerDescription = description.toLowerCase();
  for (const [location, coords] of Object.entries(commonLocations)) {
    if (lowerDescription.includes(location)) {
      [latitude, longitude] = coords;
      break;
    }
  }
  
  return { latitude, longitude };
}

// Function to fetch and scrape a single source
async function scrapeSource(source: any) {
  console.log(`Starting to scrape ${source.name} (${source.url})`);
  
  try {
    // Fetch the page
    const response = await fetch(source.url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source.url}: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`Successfully fetched HTML from ${source.name} (${html.length} bytes)`);
    
    // Parse the page using the appropriate parser
    const parser = parsers[source.parser as keyof typeof parsers];
    if (!parser) {
      throw new Error(`No parser found for ${source.parser}`);
    }
    
    const events = await parser(html, source);
    console.log(`Extracted ${events.length} events from ${source.name}`);
    
    // Enhance events with location data
    return events.map(event => {
      const { latitude, longitude } = extractLocation(event.description);
      return {
        ...event,
        latitude,
        longitude
      };
    });
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error);
    return [];
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
    const { sourcesToScrape } = await req.json();
    const sourcesToProcess = sourcesToScrape?.length 
      ? SCRAPE_SOURCES.filter(source => sourcesToScrape.includes(source.name))
      : SCRAPE_SOURCES;
    
    console.log(`Processing ${sourcesToProcess.length} sources`);

    // Get Supabase admin client
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    
    if (!supabaseAdminKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAdminKey);
    
    // Results container
    const results = {
      totalSources: sourcesToProcess.length,
      sourcesProcessed: 0,
      totalEvents: 0,
      newEvents: 0,
      existingEvents: 0,
      failures: 0,
      sourceResults: []
    };
    
    // Process each source
    for (const source of sourcesToProcess) {
      try {
        const events = await scrapeSource(source);
        
        let newEventsCount = 0;
        let existingEventsCount = 0;
        
        // Insert events into database
        for (const event of events) {
          // Check if this event already exists (by title and source)
          const { data: existingEvents, error: checkError } = await supabase
            .from('historical_events')
            .select('id')
            .eq('title', event.title)
            .eq('source_url', event.source_url)
            .limit(1);
          
          if (checkError) {
            console.error('Error checking for existing event:', checkError);
            continue;
          }
          
          if (existingEvents && existingEvents.length > 0) {
            existingEventsCount++;
            continue;
          }
          
          // Insert the new event
          const { error: insertError } = await supabase
            .from('historical_events')
            .insert([event]);
          
          if (insertError) {
            console.error('Error inserting event:', insertError);
            results.failures++;
          } else {
            newEventsCount++;
          }
        }
        
        results.sourceResults.push({
          sourceName: source.name,
          eventsFound: events.length,
          newEvents: newEventsCount,
          existingEvents: existingEventsCount,
          status: 'success'
        });
        
        results.sourcesProcessed++;
        results.totalEvents += events.length;
        results.newEvents += newEventsCount;
        results.existingEvents += existingEventsCount;
        
      } catch (error) {
        console.error(`Error processing source ${source.name}:`, error);
        results.failures++;
        results.sourceResults.push({
          sourceName: source.name,
          eventsFound: 0,
          newEvents: 0,
          existingEvents: 0,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Add scraping log
    const { error: logError } = await supabase
      .from('scraper_logs')
      .insert([{
        sources_processed: results.sourcesProcessed,
        total_events_found: results.totalEvents,
        new_events_added: results.newEvents,
        failures: results.failures,
        details: results.sourceResults
      }]);
    
    if (logError) {
      console.error('Error logging scraper results:', logError);
    }
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in scrape-historical-events function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
