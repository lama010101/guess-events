
import React from 'react';
import PhotoViewer from '@/components/PhotoViewer';
import GameMap from '@/components/GameMap';

interface ResultMediaProps {
  imageUrl: string;
  eventDescription: string;
  userGuessLocation: { lat: number; lng: number };
  correctLocation: { lat: number; lng: number; name: string };
  userAvatar?: string | null;
}

const ResultMedia: React.FC<ResultMediaProps> = ({
  imageUrl,
  eventDescription,
  userGuessLocation,
  correctLocation,
  userAvatar
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-96">
        <PhotoViewer src={imageUrl} alt={eventDescription} />
      </div>
      
      <div className="h-96">
        <GameMap 
          onLocationSelect={() => {}} 
          selectedLocation={userGuessLocation}
          correctLocation={correctLocation}
          showCorrectPin={true}
          isDisabled={true}
          userAvatar={userAvatar}
          disableScroll={true}
        />
      </div>
    </div>
  );
};

export default ResultMedia;
