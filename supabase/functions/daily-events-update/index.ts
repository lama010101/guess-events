
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily events update check");
    
    // Get admin credentials from environment
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    
    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseAdminKey);
    
    // Check if we already have events in the database
    const { count, error: countError } = await supabase
      .from('historical_events')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw new Error(`Error checking events count: ${countError.message}`);
    }
    
    console.log(`Found ${count} existing historical events`);
    
    // If we don't have any events, import them
    if (count === 0) {
      console.log("No events found, calling import-historical-events function");
      
      // Call the import function with force refresh to ensure all images are imported
      const { data: importData, error: importError } = await supabase.functions.invoke('import-historical-events', {
        method: 'POST',
        body: { forceRefresh: true }
      });
      
      if (importError) {
        throw new Error(`Error calling import function: ${importError.message}`);
      }
      
      console.log("Import completed successfully:", importData);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: `Imported ${importData.results?.filter((r: any) => r.status === 'success').length || 0} historical events`,
        results: importData.results
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify that all events have images
    const { data: eventsWithoutImages, error: imageCheckError } = await supabase
      .from('historical_events')
      .select('id, year, description')
      .is('image_url', null);
    
    if (imageCheckError) {
      throw new Error(`Error checking events without images: ${imageCheckError.message}`);
    }
    
    if (eventsWithoutImages && eventsWithoutImages.length > 0) {
      console.log(`Found ${eventsWithoutImages.length} events without images, fixing...`);
      
      // Call import function to fix the images
      const { data: fixData, error: fixError } = await supabase.functions.invoke('import-historical-events', {
        method: 'POST',
        body: { fixImages: true, forceRefresh: true }
      });
      
      if (fixError) {
        throw new Error(`Error fixing images: ${fixError.message}`);
      }
      
      console.log("Image fix completed successfully:", fixData);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: `Fixed images for ${fixData.results?.filter((r: any) => r.status === 'success').length || 0} historical events`,
        results: fixData.results
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `All ${count} events have been verified and have images`,
      eventsCount: count,
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
