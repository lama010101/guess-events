
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to compress and optimize images
 * @param file The image file to optimize
 * @param maxWidthHeight Maximum width/height dimension
 * @param quality JPEG quality (0-1)
 * @returns Promise with optimized image blob
 */
export const optimizeImage = async (
  file: File | Blob,
  maxWidthHeight = 1200,
  quality = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Release object URL
      URL.revokeObjectURL(img.src);
      
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > maxWidthHeight) {
        height *= maxWidthHeight / width;
        width = maxWidthHeight;
      } else if (height > maxWidthHeight) {
        width *= maxWidthHeight / height;
        height = maxWidthHeight;
      }
      
      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const originalSize = file.size;
            const optimizedSize = blob.size;
            console.log(`Image optimized: ${(originalSize / 1024).toFixed(2)}KB → ${(optimizedSize / 1024).toFixed(2)}KB (${((1 - optimizedSize / originalSize) * 100).toFixed(2)}% reduction)`);
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Process an image URL, optimize it and return the new URL
 * @param imageUrl Original image URL
 * @returns Optimized image URL
 */
export const processAndOptimizeImageUrl = async (imageUrl: string): Promise<string> => {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    
    // Skip optimization if already small
    if (blob.size < 100 * 1024) {
      console.log('Image already small, skipping optimization');
      return imageUrl;
    }
    
    // Optimize the image
    const optimizedBlob = await optimizeImage(blob);
    
    // Upload the optimized image
    const fileName = imageUrl.split('/').pop() || 'optimized-image.jpg';
    const optimizedFileName = `optimized-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(optimizedFileName, optimizedBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg'
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(optimizedFileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original URL if optimization fails
    return imageUrl;
  }
};

/**
 * Bulk process multiple images in the historical_events table
 * @returns Promise with the number of images processed
 */
export const optimizeAllEventImages = async (): Promise<number> => {
  try {
    // Get all events with images
    const { data: events, error } = await supabase
      .from('historical_events')
      .select('id, image_url')
      .not('image_url', 'is', null);
    
    if (error) throw error;
    if (!events || events.length === 0) return 0;
    
    console.log(`Processing ${events.length} event images`);
    
    let processedCount = 0;
    
    // Process each image sequentially to avoid overloading
    for (const event of events) {
      if (!event.image_url) continue;
      
      try {
        const optimizedUrl = await processAndOptimizeImageUrl(event.image_url);
        
        // Update the event with the optimized URL
        if (optimizedUrl !== event.image_url) {
          const { error: updateError } = await supabase
            .from('historical_events')
            .update({ image_url: optimizedUrl })
            .eq('id', event.id);
          
          if (updateError) throw updateError;
          processedCount++;
        }
      } catch (err) {
        console.error(`Error processing image for event ${event.id}:`, err);
      }
    }
    
    return processedCount;
  } catch (error) {
    console.error('Error in bulk image optimization:', error);
    throw error;
  }
};
