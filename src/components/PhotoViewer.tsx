
import React from 'react';
import { Card } from "@/components/ui/card";

export interface PhotoViewerProps {
  image: string;
  src?: string; // Alternative prop name
  description?: string;
  hint?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ 
  image, 
  src, 
  description,
  hint
}) => {
  // Use either image or src prop
  const imageSrc = image || src;
  
  return (
    <div className="relative w-full h-full min-h-[40vh]">
      <img 
        src={imageSrc} 
        alt={description || "Historical photo"} 
        className="w-full h-full object-cover" 
      />
      
      {hint && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {hint}
        </div>
      )}
      
      {description && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-sm">
          {description}
        </div>
      )}
    </div>
  );
};

export default PhotoViewer;
