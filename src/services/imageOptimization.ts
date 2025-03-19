
import { supabase } from '@/integrations/supabase/client';

const MAX_IMAGE_SIZE = 800; // Maximum width or height in pixels

/**
 * Optimize an image by resizing it and compressing it
 * @param imageUrl The URL of the image to optimize
 * @returns A Promise that resolves to the optimized image URL
 */
export const optimizeImage = async (imageUrl: string): Promise<string> => {
  try {
    // Skip optimization for already optimized images
    if (imageUrl.includes('optimized/')) {
      return imageUrl;
    }
    
    // Skip optimization for external URLs that we can't process
    if (!imageUrl.includes('supabase.co') && !imageUrl.includes('localhost')) {
      return imageUrl;
    }
    
    // Download the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Wait for the image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
    
    // Create a canvas for resizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Calculate new dimensions while maintaining aspect ratio
    let width = img.width;
    let height = img.height;
    
    if (width > height && width > MAX_IMAGE_SIZE) {
      height = Math.round((height * MAX_IMAGE_SIZE) / width);
      width = MAX_IMAGE_SIZE;
    } else if (height > MAX_IMAGE_SIZE) {
      width = Math.round((width * MAX_IMAGE_SIZE) / height);
      height = MAX_IMAGE_SIZE;
    }
    
    // Set canvas dimensions and draw the resized image
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert the canvas to a Blob with reduced quality
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8);
    });
    
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `optimized/${timestamp}_${randomString}.jpg`;
    
    // Upload the optimized image to Supabase storage
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL of the uploaded image
    const { data: urlData } = await supabase.storage
      .from('event-images')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Image optimization error:', error);
    // Return the original URL if optimization fails
    return imageUrl;
  }
};

/**
 * Optimize all historical event images in the database
 * @returns A Promise that resolves when optimization is complete
 */
export const optimizeAllHistoricalEventImages = async (): Promise<void> => {
  try {
    // Call the PostgreSQL function to optimize all images
    await supabase.rpc('optimize_all_historical_event_images');
  } catch (error) {
    console.error('Error optimizing all images:', error);
  }
};

/**
 * Ensure an image is optimized before displaying it
 * @param url The URL of the image to optimize
 * @returns The optimized image URL or the original URL if optimization fails
 */
export const getOptimizedImageUrl = (url: string | null): string => {
  if (!url) return '/placeholder.svg';
  
  // For external URLs or already optimized URLs, return as is
  if (!url.includes('supabase.co') || url.includes('optimized/')) {
    return url;
  }
  
  // Add transformation parameters for Supabase Storage images
  // This uses the Imgproxy functionality built into Supabase
  const transformationParams = 'width=800&height=800&resize=contain';
  
  // Check if the URL already has query parameters
  if (url.includes('?')) {
    return `${url}&${transformationParams}`;
  } else {
    return `${url}?${transformationParams}`;
  }
};
