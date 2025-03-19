import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { JSZip } from "https://esm.sh/jszip@3.10.1";
import { optimize } from "https://esm.sh/svgo@3.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalEvent {
  year: number;
  title?: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  hint_year?: string;
  hint_location?: string;
  image_data?: Uint8Array;
  image_name?: string;
}

// Function to optimize and process image
async function optimizeImage(imageData: Uint8Array): Promise<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  // Convert image to base64 for processing
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData)));
  const mimeType = determineMimeType(imageData);
  
  // If it's an SVG, optimize it
  if (mimeType === 'image/svg+xml') {
    try {
      const svgText = decoder.decode(imageData);
      const optimized = optimize(svgText);
      return encoder.encode(optimized.data);
    } catch (e) {
      console.error('SVG optimization error:', e);
      return imageData; // Return original if optimization fails
    }
  }
  
  // For other image types, we'd use image compression libraries
  // This would require additional packages for PNG/JPEG optimization
  // For now, we'll just return the original
  return imageData;
}

// Function to determine MIME type from file header
function determineMimeType(bytes: Uint8Array): string {
  const signature = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Check file signatures
  if (signature.startsWith('89504e47')) return 'image/png';
  if (signature.startsWith('ffd8ff')) return 'image/jpeg';
  if (bytes.length > 10 && decoder.decode(bytes.slice(0, 5)) === '<?xml') return 'image/svg+xml';
  if (decoder.decode(bytes.slice(0, 10)).includes('<svg')) return 'image/svg+xml';
  
  // Default to JPEG if unknown
  return 'image/jpeg';
}

const decoder = new TextDecoder();

// Function to process Excel file and extract historical events
function processExcelFile(excelData: Uint8Array): HistoricalEvent[] {
  try {
    const workbook = XLSX.read(excelData);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Map Excel data to HistoricalEvent objects
    return jsonData.map((row: any) => ({
      year: parseInt(row.Year) || 0,
      title: row.Title || '',
      description: row.Description || '',
      location_name: row.LocationName || row['Location Name'] || '',
      latitude: parseFloat(row.Latitude) || 0,
      longitude: parseFloat(row.Longitude) || 0,
      hint_year: row.HintYear || row['Hint Year'] || '',
      hint_location: row.HintLocation || row['Hint Location'] || '',
    })).filter(event => event.year && event.description && event.location_name);
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error('Failed to process Excel file: ' + error.message);
  }
}

// Function to process ZIP file containing Excel and images
async function processZipFile(zipData: Uint8Array): Promise<HistoricalEvent[]> {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipData);
    let excelData: Uint8Array | null = null;
    const imageFiles: { [key: string]: Uint8Array } = {};
    
    // Extract Excel and image files
    for (const [filename, file] of Object.entries(contents.files)) {
      if (!file.dir) {
        if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
          excelData = new Uint8Array(await file.async('arraybuffer'));
        } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || 
                  filename.endsWith('.png') || filename.endsWith('.svg')) {
          imageFiles[filename] = new Uint8Array(await file.async('arraybuffer'));
        }
      }
    }
    
    if (!excelData) {
      throw new Error('No Excel file found in ZIP archive');
    }
    
    // Process Excel data
    const events = processExcelFile(excelData);
    
    // Match images with events based on title or descriptions
    return events.map(event => {
      // Try to find a matching image file based on event title/description
      const eventTitle = event.title?.toLowerCase() || '';
      const eventDesc = event.description.toLowerCase();
      
      for (const [filename, imageData] of Object.entries(imageFiles)) {
        const baseFilename = filename.split('/').pop()?.split('.')[0]?.toLowerCase() || '';
        
        // Check if filename matches title or contains key words from description
        if (eventTitle && baseFilename.includes(eventTitle.substring(0, 10)) || 
            eventDesc && baseFilename.includes(eventDesc.substring(0, 10))) {
          return {
            ...event,
            image_data: imageData,
            image_name: filename
          };
        }
      }
      
      // Return event without image if no match found
      return event;
    });
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    throw new Error('Failed to process ZIP file: ' + error.message);
  }
}

// Main function to handle requests
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const requestData = await req.json();
    const { fileType, filePath } = requestData;
    
    // Historical events to import
    let eventsToImport: HistoricalEvent[] = [];
    
    // If fileType is provided, process uploaded file
    if (fileType && filePath) {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('event-images')
        .download(filePath);
      
      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }
      
      // Process file based on type
      if (fileType === 'excel') {
        eventsToImport = processExcelFile(new Uint8Array(await fileData.arrayBuffer()));
      } else if (fileType === 'zip') {
        eventsToImport = await processZipFile(new Uint8Array(await fileData.arrayBuffer()));
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } else {
      // If no file, use the default historical events
      const defaultEvents = [
        {
          year: 1945,
          description: "Raising the Flag on Iwo Jima - American soldiers raise the U.S. flag on Mount Suribachi during the Battle of Iwo Jima in World War II.",
          location_name: "Iwo Jima, Japan",
          latitude: 24.7580,
          longitude: 141.2917,
          hint_year: "End of World War II",
          hint_location: "Pacific island battlefield"
        },
        {
          year: 1963,
          description: "Martin Luther King Jr. delivers his famous 'I Have a Dream' speech during the March on Washington for Jobs and Freedom, advocating for civil rights and an end to racism.",
          location_name: "Lincoln Memorial, Washington D.C., USA",
          latitude: 38.8893,
          longitude: -77.0502,
          hint_year: "Civil Rights Movement",
          hint_location: "National Mall"
        },
        {
          year: 1969,
          description: "Apollo 11 Mission - Neil Armstrong becomes the first human to step on the surface of the Moon, marking a historic achievement in space exploration.",
          location_name: "Sea of Tranquility, Moon",
          latitude: 0.6744,
          longitude: 23.4322,
          hint_year: "Space Race",
          hint_location: "Lunar surface"
        },
        {
          year: 1989,
          description: "Fall of the Berlin Wall - Citizens began dismantling the Berlin Wall, symbolizing the end of the Cold War and the reunification of East and West Germany.",
          location_name: "Berlin, Germany",
          latitude: 52.5163,
          longitude: 13.3777,
          hint_year: "End of Cold War",
          hint_location: "Former border"
        },
        {
          year: 1955,
          description: "Rosa Parks refuses to give up her seat on a bus in Montgomery, Alabama, becoming a symbol of the Civil Rights Movement and sparking the Montgomery Bus Boycott.",
          location_name: "Montgomery, Alabama, USA",
          latitude: 32.3792,
          longitude: -86.3077,
          hint_year: "Civil Rights Movement",
          hint_location: "Southern city"
        },
        {
          year: 1912,
          description: "The RMS Titanic sinks in the North Atlantic Ocean after colliding with an iceberg during her maiden voyage, resulting in the deaths of more than 1,500 passengers and crew.",
          location_name: "North Atlantic Ocean",
          latitude: 41.7260,
          longitude: -49.9477,
          hint_year: "Early 20th century",
          hint_location: "Transatlantic route"
        },
        {
          year: 1941,
          description: "Attack on Pearl Harbor - Japan launches a surprise military strike on the United States naval base at Pearl Harbor, leading to America's entry into World War II.",
          location_name: "Pearl Harbor, Hawaii, USA",
          latitude: 21.3645,
          longitude: -157.9762,
          hint_year: "World War II",
          hint_location: "Pacific naval base"
        },
        {
          year: 1986,
          description: "Chernobyl Disaster - A catastrophic nuclear accident occurs at the Chernobyl Nuclear Power Plant, releasing radioactive particles into the atmosphere and causing widespread environmental contamination.",
          location_name: "Pripyat, Ukraine (formerly USSR)",
          latitude: 51.3890,
          longitude: 30.0978,
          hint_year: "Late 20th century",
          hint_location: "Eastern European power plant"
        },
        {
          year: 2001,
          description: "September 11 attacks - Terrorists hijack four passenger airplanes, crashing two into the World Trade Center in New York City, one into the Pentagon, and one in a field in Pennsylvania.",
          location_name: "New York City, New York, USA",
          latitude: 40.7115,
          longitude: -74.0134,
          hint_year: "Early 21st century",
          hint_location: "American metropolis"
        },
        {
          year: 1776,
          description: "The United States Declaration of Independence is adopted by the Continental Congress, announcing the colonies' separation from Great Britain and establishing the United States of America.",
          location_name: "Philadelphia, Pennsylvania, USA",
          latitude: 39.9483,
          longitude: -75.1678,
          hint_year: "Late 18th century",
          hint_location: "American colonial city"
        }
      ];
      
      eventsToImport = defaultEvents;
    }
    
    const importResults = [];
    
    // Process each historical event
    for (const event of eventsToImport) {
      let imageUrl = null;
      
      // If event has image data, upload it to storage
      if (event.image_data && event.image_name) {
        try {
          // Optimize image before uploading
          const optimizedImage = await optimizeImage(event.image_data);
          
          // Generate unique filename
          const timestamp = new Date().getTime();
          const randomString = Math.random().toString(36).substring(2, 8);
          const fileExt = event.image_name.split('.').pop();
          const uniqueFileName = `events/${timestamp}_${randomString}.${fileExt}`;
          
          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('event-images')
            .upload(uniqueFileName, optimizedImage, {
              contentType: determineMimeType(event.image_data)
            });
          
          if (uploadError) {
            throw uploadError;
          }
          
          // Get public URL for the uploaded image
          const { data: urlData } = await supabase
            .storage
            .from('event-images')
            .getPublicUrl(uniqueFileName);
          
          imageUrl = urlData.publicUrl;
          
        } catch (error) {
          console.error('Error uploading image:', error);
          // Continue with the event import even if image upload fails
        }
      }
      
      try {
        // Insert into Supabase database
        const { data, error } = await supabase
          .from('historical_events')
          .insert({
            year: event.year,
            description: event.description,
            image_url: imageUrl,
            location_name: event.location_name,
            latitude: event.latitude,
            longitude: event.longitude,
            hint_year: event.hint_year,
            hint_location: event.hint_location
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
          id: data.id,
          has_image: !!imageUrl
        });
      } catch (error) {
        console.error('Error inserting event:', error);
        importResults.push({
          year: event.year,
          description: event.description.substring(0, 30) + '...',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Clean up the temporary file if it exists
    if (filePath) {
      try {
        await supabase.storage.from('event-images').remove([filePath]);
      } catch (error) {
        console.error('Error removing temporary file:', error);
      }
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
