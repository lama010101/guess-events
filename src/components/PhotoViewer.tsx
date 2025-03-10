
import React, { useState, useEffect } from 'react';
import { Maximize, Minimize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoViewerProps {
  src: string;
  alt?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ src, alt = "Historical photograph" }) => {
  const [zoomed, setZoomed] = useState(false);
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  useEffect(() => {
    // Check image dimensions when loaded
    const img = new Image();
    img.onload = () => {
      setImageOrientation(img.width > img.height ? 'landscape' : 'portrait');
    };
    img.src = src;
  }, [src]);
  
  return (
    <div className={`relative rounded-lg overflow-hidden shadow-md ${zoomed ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'w-full h-full'}`}>
      <img 
        src={src} 
        alt={alt} 
        className={`
          ${zoomed ? 'max-h-screen max-w-screen w-auto h-auto object-contain' : 'w-full h-full object-cover'} 
        `}
        style={{
          // Ensure image takes the entire viewport in fullscreen, respecting orientation
          ...(zoomed && {
            width: imageOrientation === 'landscape' ? 'auto' : '100%',
            height: imageOrientation === 'portrait' ? 'auto' : '100%',
            maxWidth: '100vw',
            maxHeight: '100vh'
          })
        }}
      />
      
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute bottom-4 right-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90"
        onClick={() => setZoomed(!zoomed)}
      >
        {zoomed ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </Button>

      {zoomed && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90"
          onClick={() => setZoomed(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PhotoViewer;
