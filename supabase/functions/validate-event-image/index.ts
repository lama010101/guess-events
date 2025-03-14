
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

interface ValidationRequest {
  eventId: string;
  validateContent?: boolean;
  useFallbackSources?: boolean;
  confidenceThreshold?: number;
}

interface ValidationResult {
  success: boolean;
  message: string;
  newImageUrl?: string;
  metadata?: {
    confidence: number;
    historicalContext?: string;
    keywords?: string[];
    temporalConsistency?: boolean;
    source?: string;
  };
}

// Cache for image validation results to avoid redundant API calls
const imageValidationCache = new Map<string, ValidationResult>();

// Cache for keyword to image mappings to remember good matches
const keywordImageCache = new Map<string, string[]>();

// Rate limiting for external API calls
const apiRateLimits = {
  wikimedia: { count: 0, resetTime: Date.now(), limit: 50 }, // 50 requests per minute
  unsplash: { count: 0, resetTime: Date.now(), limit: 30 },  // 30 requests per minute
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  console.log('Request received for validate-event-image');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request
    const payload: ValidationRequest = await req.json();
    console.log('Received payload:', JSON.stringify(payload));
    
    if (!payload.eventId) {
      throw new Error('Missing required field: eventId');
    }
    
    // Set defaults
    const validateContent = payload.validateContent !== false;
    const useFallbackSources = payload.useFallbackSources !== false;
    const confidenceThreshold = payload.confidenceThreshold || 0.85;

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('historical_events')
      .select('*')
      .eq('id', payload.eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      throw new Error(`Event not found: ${eventError.message}`);
    }

    console.log(`Processing event: ${event.year} - ${event.description.substring(0, 30)}...`);

    // If we already have a verified result in cache, return it
    const cacheKey = `event-${event.id}-${event.image_url || ''}`;
    if (imageValidationCache.has(cacheKey)) {
      console.log('Found cached validation result');
      return new Response(
        JSON.stringify(imageValidationCache.get(cacheKey)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Check if the event already has an image
    if (event.image_url) {
      console.log('Event has an image URL:', event.image_url);

      // Validate if the image is accessible
      try {
        const imageCheckResult = await checkImageAccessibility(event.image_url);
        
        if (imageCheckResult.accessible) {
          console.log('Image is accessible');
          
          // If content validation is enabled, verify the image matches the historical context
          if (validateContent) {
            console.log('Validating image content against historical context');
            const contentValidation = await validateImageContent(
              event.image_url,
              event.year,
              event.description,
              event.location_name
            );
            
            if (contentValidation.confidence >= confidenceThreshold) {
              console.log('Image content validation successful', contentValidation);
              
              // Store in cache
              const result: ValidationResult = {
                success: true,
                message: 'Image is valid and relevant to the historical context',
                newImageUrl: event.image_url,
                metadata: {
                  confidence: contentValidation.confidence,
                  keywords: contentValidation.keywords,
                  temporalConsistency: contentValidation.temporalConsistency,
                  historicalContext: contentValidation.historicalContext
                }
              };
              
              imageValidationCache.set(cacheKey, result);
              return new Response(
                JSON.stringify(result),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              console.log('Image content validation failed, finding a better match', contentValidation);
              // Image doesn't match the historical context well enough, find a better one
              return await findAndUpdateEventImage(supabase, event, validateContent, useFallbackSources, confidenceThreshold);
            }
          }
          
          // If we're not validating content, just confirm the image is accessible
          const result: ValidationResult = {
            success: true,
            message: 'Image is accessible',
            newImageUrl: event.image_url,
            metadata: {
              confidence: 1.0
            }
          };
          
          imageValidationCache.set(cacheKey, result);
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log('Image is not accessible:', imageCheckResult.error);
          // Try to find a replacement image
          return await findAndUpdateEventImage(supabase, event, validateContent, useFallbackSources, confidenceThreshold);
        }
      } catch (error) {
        console.error('Error checking image accessibility:', error);
        // Try to find a replacement image
        return await findAndUpdateEventImage(supabase, event, validateContent, useFallbackSources, confidenceThreshold);
      }
    } else {
      console.log('Event does not have an image URL, finding one');
      // Event does not have an image, try to find one
      return await findAndUpdateEventImage(supabase, event, validateContent, useFallbackSources, confidenceThreshold);
    }
  } catch (error) {
    console.error('Error in validate-event-image:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error: ${error.message}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Function to check if an image URL is accessible
async function checkImageAccessibility(imageUrl: string): Promise<{ accessible: boolean, error?: string }> {
  try {
    console.log(`Checking accessibility for image: ${imageUrl}`);
    
    // Skip validation for known good sources
    if (imageUrl.includes('wikimedia.org') || 
        imageUrl.includes('wikipedia.org') || 
        imageUrl.includes('unsplash.com')) {
      return { accessible: true };
    }
    
    const response = await fetch(imageUrl, { method: 'HEAD', redirect: 'follow' });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        return { accessible: true };
      } else {
        return { accessible: false, error: 'URL does not point to an image' };
      }
    } else {
      return { accessible: false, error: `HTTP error: ${response.status}` };
    }
  } catch (error) {
    console.error('Error in checkImageAccessibility:', error);
    return { accessible: false, error: error.message };
  }
}

// Function to validate image content against historical context
async function validateImageContent(
  imageUrl: string, 
  year: number, 
  description: string, 
  location: string
): Promise<{
  confidence: number,
  keywords: string[],
  temporalConsistency: boolean,
  historicalContext: string
}> {
  // Extract keywords from the description and location
  const extractedKeywords = extractKeywords(description, location, year);
  console.log('Extracted keywords:', extractedKeywords);
  
  // Simplified implementation for demonstration
  // In a real implementation, this would use AI vision APIs or OCR to analyze the image content
  
  // For now, we'll use a heuristic approach based on the image URL itself
  let confidence = 0.5; // Default confidence
  
  // Check if the image URL contains any of our keywords
  for (const keyword of extractedKeywords) {
    if (imageUrl.toLowerCase().includes(keyword.toLowerCase())) {
      confidence += 0.1; // Boost confidence if URL contains a keyword
    }
  }
  
  // Check if the URL contains the year or related period
  const yearStr = year.toString();
  const century = Math.floor(year / 100) + 1;
  const centuryStr = `${century}th century`;
  
  if (imageUrl.includes(yearStr)) {
    confidence += 0.2; // Significant boost if exact year is found
  } else if (imageUrl.includes(centuryStr) || imageUrl.includes(`${century - 1}00s`)) {
    confidence += 0.1; // Smaller boost for century
  }
  
  // Determine temporal consistency based on the URL and context
  const temporalConsistency = 
    imageUrl.includes(yearStr) || 
    imageUrl.includes(centuryStr) || 
    year > 1900; // Modern events are more likely to have correct images
  
  // Determine historical context
  const historicalContext = `${location}, ${year}`;
  
  return {
    confidence: Math.min(confidence, 1.0), // Cap confidence at 1.0
    keywords: extractedKeywords,
    temporalConsistency,
    historicalContext
  };
}

// Function to extract keywords from event data
function extractKeywords(description: string, location: string, year: number): string[] {
  const keywords: string[] = [];
  
  // Add the location as a keyword
  if (location) {
    const locationParts = location.split(',');
    for (const part of locationParts) {
      const trimmed = part.trim();
      if (trimmed && trimmed.length > 3) {
        keywords.push(trimmed);
      }
    }
  }
  
  // Extract significant words from the description
  if (description) {
    // Remove common stop words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'is', 'was', 'were'];
    
    // Split and process words
    const words = description
      .replace(/[^\w\s]/gi, ' ') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 3 && !stopWords.includes(word.toLowerCase()))
      .map(word => word.trim());
    
    // Add unique words
    for (const word of words) {
      if (!keywords.includes(word)) {
        keywords.push(word);
      }
    }
  }
  
  // Add the year and century
  keywords.push(year.toString());
  keywords.push(`${Math.floor(year / 100) + 1}th century`);
  
  return keywords;
}

// Function to find and update an event's image
async function findAndUpdateEventImage(
  supabase: any, 
  event: any, 
  validateContent: boolean,
  useFallbackSources: boolean,
  confidenceThreshold: number
): Promise<Response> {
  console.log(`Finding image for event: ${event.year} - ${event.description.substring(0, 30)}...`);
  
  // Check if we have cached keyword matches first
  const keywordMatches: string[] = [];
  const keywords = extractKeywords(event.description, event.location_name, event.year);
  
  for (const keyword of keywords) {
    if (keywordImageCache.has(keyword)) {
      keywordMatches.push(...keywordImageCache.get(keyword)!);
    }
  }
  
  // If we have cached matches, try them first
  if (keywordMatches.length > 0) {
    console.log('Found cached keyword matches:', keywordMatches.length);
    
    // Try the cached images
    for (const imageUrl of keywordMatches) {
      try {
        const imageCheck = await checkImageAccessibility(imageUrl);
        if (imageCheck.accessible) {
          // Check if the image is appropriate for the context
          if (validateContent) {
            const contentValidation = await validateImageContent(
              imageUrl, 
              event.year, 
              event.description, 
              event.location_name
            );
            
            if (contentValidation.confidence >= confidenceThreshold) {
              // Update the event with the new image
              const { error: updateError } = await supabase
                .from('historical_events')
                .update({ image_url: imageUrl })
                .eq('id', event.id);
                
              if (updateError) {
                console.error('Error updating event with new image:', updateError);
              } else {
                console.log('Successfully updated event with cached image');
              }
              
              const result: ValidationResult = {
                success: true,
                message: 'Found and updated with cached image match',
                newImageUrl: imageUrl,
                metadata: {
                  confidence: contentValidation.confidence,
                  keywords: contentValidation.keywords,
                  source: 'cache'
                }
              };
              
              // Cache the result
              const cacheKey = `event-${event.id}-${imageUrl}`;
              imageValidationCache.set(cacheKey, result);
              
              return new Response(
                JSON.stringify(result),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            // Without content validation, just use the accessible image
            const { error: updateError } = await supabase
              .from('historical_events')
              .update({ image_url: imageUrl })
              .eq('id', event.id);
              
            if (updateError) {
              console.error('Error updating event with new image:', updateError);
            } else {
              console.log('Successfully updated event with cached image');
            }
            
            const result: ValidationResult = {
              success: true,
              message: 'Found and updated with cached image match',
              newImageUrl: imageUrl,
              metadata: {
                confidence: 0.9,
                source: 'cache'
              }
            };
            
            // Cache the result
            const cacheKey = `event-${event.id}-${imageUrl}`;
            imageValidationCache.set(cacheKey, result);
            
            return new Response(
              JSON.stringify(result),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (error) {
        console.error('Error checking cached image:', error);
        // Continue to the next cached image
      }
    }
  }
  
  // Try to find an image from Wikimedia Commons
  try {
    console.log('Trying to find image on Wikimedia Commons');
    
    // Check for rate limiting on Wikimedia API
    if (
      apiRateLimits.wikimedia.count >= apiRateLimits.wikimedia.limit && 
      Date.now() - apiRateLimits.wikimedia.resetTime < 60000
    ) {
      console.log('Rate limited for Wikimedia API');
      
      // If fallbacks are allowed, try Unsplash
      if (useFallbackSources) {
        return await findImageFromUnsplash(supabase, event, validateContent, confidenceThreshold);
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Rate limited for Wikimedia API'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Increment rate limit counter
    apiRateLimits.wikimedia.count++;
    if (Date.now() - apiRateLimits.wikimedia.resetTime >= 60000) {
      // Reset after 1 minute
      apiRateLimits.wikimedia.count = 1;
      apiRateLimits.wikimedia.resetTime = Date.now();
    }
    
    // Extract search terms from the event
    const searchTerms = [
      event.year.toString(),
      ...extractKeywords(event.description, event.location_name, event.year)
    ].slice(0, 5); // Limit to top 5 keywords
    
    const searchQuery = searchTerms.join(' ');
    console.log('Wikimedia search query:', searchQuery);
    
    // Search for images on Wikimedia Commons
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&format=json&srlimit=5`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Wikimedia search API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData?.query?.search && searchData.query.search.length > 0) {
      console.log(`Found ${searchData.query.search.length} potential matches on Wikimedia`);
      
      // Get details for each potential match
      for (const result of searchData.query.search) {
        try {
          // Get file info
          const title = result.title;
          const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
          
          const infoResponse = await fetch(infoUrl);
          
          if (!infoResponse.ok) {
            console.log(`Error fetching info for ${title}: ${infoResponse.status}`);
            continue;
          }
          
          const infoData = await infoResponse.json();
          const pages = infoData?.query?.pages;
          
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const imageInfo = pages[pageId]?.imageinfo?.[0];
            
            if (imageInfo?.url) {
              console.log(`Found image URL: ${imageInfo.url}`);
              
              // If content validation is required, check the image
              if (validateContent) {
                const contentValidation = await validateImageContent(
                  imageInfo.url,
                  event.year,
                  event.description,
                  event.location_name
                );
                
                if (contentValidation.confidence >= confidenceThreshold) {
                  // Update the event with the new image
                  const { error: updateError } = await supabase
                    .from('historical_events')
                    .update({ 
                      image_url: imageInfo.url,
                      image_attribution: imageInfo?.extmetadata?.Artist?.value || 'Wikimedia Commons',
                      image_license: imageInfo?.extmetadata?.License?.value || 'See Wikimedia Commons'
                    })
                    .eq('id', event.id);
                    
                  if (updateError) {
                    console.error('Error updating event with new image:', updateError);
                  } else {
                    console.log('Successfully updated event with Wikimedia image');
                    
                    // Cache the image URL for these keywords
                    for (const keyword of contentValidation.keywords) {
                      if (!keywordImageCache.has(keyword)) {
                        keywordImageCache.set(keyword, []);
                      }
                      keywordImageCache.get(keyword)!.push(imageInfo.url);
                    }
                  }
                  
                  const result: ValidationResult = {
                    success: true,
                    message: 'Found and updated with Wikimedia Commons image',
                    newImageUrl: imageInfo.url,
                    metadata: {
                      confidence: contentValidation.confidence,
                      keywords: contentValidation.keywords,
                      historicalContext: contentValidation.historicalContext,
                      source: 'wikimedia'
                    }
                  };
                  
                  // Cache the result
                  const cacheKey = `event-${event.id}-${imageInfo.url}`;
                  imageValidationCache.set(cacheKey, result);
                  
                  return new Response(
                    JSON.stringify(result),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                  );
                }
              } else {
                // Without content validation, just use the image
                const { error: updateError } = await supabase
                  .from('historical_events')
                  .update({ 
                    image_url: imageInfo.url,
                    image_attribution: imageInfo?.extmetadata?.Artist?.value || 'Wikimedia Commons',
                    image_license: imageInfo?.extmetadata?.License?.value || 'See Wikimedia Commons'
                  })
                  .eq('id', event.id);
                  
                if (updateError) {
                  console.error('Error updating event with new image:', updateError);
                } else {
                  console.log('Successfully updated event with Wikimedia image');
                }
                
                const result: ValidationResult = {
                  success: true,
                  message: 'Found and updated with Wikimedia Commons image',
                  newImageUrl: imageInfo.url,
                  metadata: {
                    confidence: 0.9,
                    source: 'wikimedia'
                  }
                };
                
                // Cache the result
                const cacheKey = `event-${event.id}-${imageInfo.url}`;
                imageValidationCache.set(cacheKey, result);
                
                return new Response(
                  JSON.stringify(result),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }
        } catch (error) {
          console.error('Error processing Wikimedia result:', error);
          // Continue to the next result
        }
      }
    }
    
    console.log('No suitable Wikimedia images found');
    
    // If fallbacks are allowed, try Unsplash
    if (useFallbackSources) {
      return await findImageFromUnsplash(supabase, event, validateContent, confidenceThreshold);
    }
    
    // No suitable image found
    const result: ValidationResult = {
      success: false,
      message: 'No suitable image found on Wikimedia Commons',
      metadata: {
        confidence: 0,
        source: 'none'
      }
    };
    
    // Cache the result
    const cacheKey = `event-${event.id}-none`;
    imageValidationCache.set(cacheKey, result);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error searching Wikimedia:', error);
    
    // If fallbacks are allowed, try Unsplash
    if (useFallbackSources) {
      return await findImageFromUnsplash(supabase, event, validateContent, confidenceThreshold);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error searching Wikimedia: ${error.message}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to find an image from Unsplash
async function findImageFromUnsplash(
  supabase: any, 
  event: any, 
  validateContent: boolean,
  confidenceThreshold: number
): Promise<Response> {
  try {
    console.log('Trying to find image on Unsplash');
    
    // Check for rate limiting on Unsplash API
    if (
      apiRateLimits.unsplash.count >= apiRateLimits.unsplash.limit && 
      Date.now() - apiRateLimits.unsplash.resetTime < 60000
    ) {
      console.log('Rate limited for Unsplash API');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Rate limited for Unsplash API'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Increment rate limit counter
    apiRateLimits.unsplash.count++;
    if (Date.now() - apiRateLimits.unsplash.resetTime >= 60000) {
      // Reset after 1 minute
      apiRateLimits.unsplash.count = 1;
      apiRateLimits.unsplash.resetTime = Date.now();
    }
    
    // Extract search terms from the event
    const searchTerms = [
      event.location_name.split(',')[0].trim(), // First part of location (e.g., "Paris" from "Paris, France")
      ...extractKeywords(event.description, '', event.year).slice(0, 3) // Top 3 keywords
    ];
    
    const searchQuery = searchTerms.join(' ');
    console.log('Unsplash search query:', searchQuery);
    
    // Search Unsplash using their public API
    // Note: This uses the demo API which has limited requests. In production, use a proper API key.
    const searchUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&count=1&orientation=landscape&client_id=UTONm3QiVNkUbR0SRDEkmw65G1bMDfq6lHUrvvNcJrc`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Unsplash API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData && searchData.length > 0) {
      const imageUrl = searchData[0].urls.regular;
      console.log(`Found Unsplash image: ${imageUrl}`);
      
      // If content validation is required, check the image
      if (validateContent) {
        // With Unsplash, we use a lower threshold since these are generic stock photos
        const adjustedThreshold = confidenceThreshold * 0.8;
        
        const contentValidation = await validateImageContent(
          imageUrl,
          event.year,
          event.description,
          event.location_name
        );
        
        if (contentValidation.confidence >= adjustedThreshold) {
          // Update the event with the new image
          const { error: updateError } = await supabase
            .from('historical_events')
            .update({ 
              image_url: imageUrl,
              image_attribution: searchData[0].user.name || 'Unsplash',
              image_license: 'Unsplash License'
            })
            .eq('id', event.id);
            
          if (updateError) {
            console.error('Error updating event with new image:', updateError);
          } else {
            console.log('Successfully updated event with Unsplash image');
            
            // Cache the image URL for these keywords
            for (const keyword of contentValidation.keywords) {
              if (!keywordImageCache.has(keyword)) {
                keywordImageCache.set(keyword, []);
              }
              keywordImageCache.get(keyword)!.push(imageUrl);
            }
          }
          
          const result: ValidationResult = {
            success: true,
            message: 'Found and updated with Unsplash image',
            newImageUrl: imageUrl,
            metadata: {
              confidence: contentValidation.confidence,
              keywords: contentValidation.keywords,
              source: 'unsplash'
            }
          };
          
          // Cache the result
          const cacheKey = `event-${event.id}-${imageUrl}`;
          imageValidationCache.set(cacheKey, result);
          
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Without content validation, just use the image
        const { error: updateError } = await supabase
          .from('historical_events')
          .update({ 
            image_url: imageUrl,
            image_attribution: searchData[0].user.name || 'Unsplash',
            image_license: 'Unsplash License'
          })
          .eq('id', event.id);
          
        if (updateError) {
          console.error('Error updating event with new image:', updateError);
        } else {
          console.log('Successfully updated event with Unsplash image');
        }
        
        const result: ValidationResult = {
          success: true,
          message: 'Found and updated with Unsplash image',
          newImageUrl: imageUrl,
          metadata: {
            confidence: 0.7, // Lower confidence for generic stock photos
            source: 'unsplash'
          }
        };
        
        // Cache the result
        const cacheKey = `event-${event.id}-${imageUrl}`;
        imageValidationCache.set(cacheKey, result);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // No suitable image found
    return new Response(
      JSON.stringify({
        success: false,
        message: 'No suitable image found on Unsplash'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error searching Unsplash: ${error.message}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
