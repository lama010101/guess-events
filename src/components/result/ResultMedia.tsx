
import React, { useRef, useEffect } from 'react';
import PhotoViewer from '@/components/PhotoViewer';
import GameMap from '@/components/GameMap';
import { CheckCircle } from 'lucide-react';

interface ResultMediaProps {
  imageUrl: string;
  eventTitle?: string;
  eventDescription: string;
  userGuessLocation: { lat: number; lng: number };
  correctLocation: { lat: number; lng: number; name: string };
  userAvatar?: string | null;
}

const ResultMedia: React.FC<ResultMediaProps> = ({
  imageUrl,
  eventTitle,
  eventDescription,
  userGuessLocation,
  correctLocation,
  userAvatar
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (mapRef.current) {
      // Apply touch action style to enable two finger panning
      mapRef.current.style.touchAction = 'pinch-zoom';
    }
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-96">
        <div className="mb-2">
          {eventTitle && <h3 className="font-semibold text-lg">{eventTitle}</h3>}
          <p className="text-gray-600 dark:text-gray-400">{eventDescription}</p>
        </div>
        <PhotoViewer src={imageUrl} alt={eventDescription} />
      </div>
      
      <div className="h-96 relative z-10" ref={mapRef}>
        <GameMap 
          onLocationSelect={() => {}} 
          selectedLocation={userGuessLocation}
          correctLocation={correctLocation}
          showCorrectPin={true}
          showConnectingLine={true}
          isDisabled={true}
          userAvatar={userAvatar}
          disableScroll={false}
          correctLocationIcon={<CheckCircle className="text-green-500" />}
        />
      </div>
    </div>
  );
};

export default ResultMedia;
