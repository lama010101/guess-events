
import React, { useState, useEffect } from 'react';
import { Maximize, Minimize, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface PhotoViewerProps {
  src: string;
  alt?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ src, alt = "Historical photograph" }) => {
  const [zoomed, setZoomed] = useState(false);
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const loadImage = () => {
    setIsLoading(true);
    setHasError(false);
    
    const img = new Image();
    
    img.onload = () => {
      setImageOrientation(img.width > img.height ? 'landscape' : 'portrait');
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    
    img.src = src;
  };
  
  useEffect(() => {
    loadImage();
  }, [src]);
  
  const handleRetry = () => {
    loadImage();
  };
  
  return (
    <div className={`relative rounded-lg overflow-hidden shadow-md ${zoomed ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'w-full h-full'}`}>
      {isLoading ? (
        <div className="w-full h-full">
          <AspectRatio ratio={16/9}>
            <Skeleton className="h-full w-full rounded-none" />
          </AspectRatio>
        </div>
      ) : hasError ? (
        <div className="w-full h-full flex items-center justify-center">
          <Alert variant="destructive" className="mx-auto max-w-md">
            <AlertDescription className="flex flex-col gap-4 items-center">
              <p>Failed to load image. Please try again.</p>
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className={`
            ${zoomed ? 'object-contain w-full h-full' : 'w-full h-full object-cover'} 
          `}
        />
      )}
      
      {!isLoading && !hasError && (
        <>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute bottom-4 right-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 z-10"
            onClick={() => setZoomed(!zoomed)}
          >
            {zoomed ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          {zoomed && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 z-10"
              onClick={() => setZoomed(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default PhotoViewer;
