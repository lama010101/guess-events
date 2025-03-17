
import React, { useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useMapInteraction } from '@/hooks/useMapInteraction';
import { createMapStyles } from '@/utils/mapUtils';

interface GameMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number; name: string };
  showCorrectPin?: boolean;
  isDisabled?: boolean;
  userAvatar?: string | null;
  locationHint?: { lat: number; lng: number; radiusKm: number } | undefined;
  disableScroll?: boolean;
}

const GameMap: React.FC<GameMapProps> = (props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { initializeMap } = useMapInteraction(props);
  
  useEffect(() => {
    createMapStyles();
    
    if (mapContainerRef.current) {
      initializeMap(mapContainerRef.current);
    }
  }, [initializeMap]);

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-md overflow-hidden"></div>
  );
};

export default GameMap;
