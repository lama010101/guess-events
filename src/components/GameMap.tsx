
import React, { useRef, useEffect } from 'react';
import { useMapInteraction } from '@/hooks/useMapInteraction';

interface GameMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number; name: string };
  showCorrectPin?: boolean;
  showConnectingLine?: boolean;
  isDisabled?: boolean;
  userAvatar?: string | null;
  locationHint?: { lat: number; lng: number; radiusKm: number };
  disableScroll?: boolean;
  correctLocationIcon?: React.ReactNode;
}

const GameMap: React.FC<GameMapProps> = ({
  onLocationSelect,
  selectedLocation,
  correctLocation,
  showCorrectPin = false,
  showConnectingLine = false,
  isDisabled = false,
  userAvatar = null,
  locationHint,
  disableScroll = false,
  correctLocationIcon
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  const { initializeMap } = useMapInteraction({
    onLocationSelect,
    selectedLocation,
    correctLocation,
    showCorrectPin,
    showConnectingLine,
    isDisabled,
    userAvatar,
    locationHint,
    disableScroll,
    correctLocationIcon,
  });
  
  useEffect(() => {
    if (mapRef.current) {
      initializeMap(mapRef.current);
    }
  }, [initializeMap]);
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-md relative z-10 touch-manipulation" 
      style={{ touchAction: 'none' }} // Always disable browser's touch actions for better map control
    />
  );
};

export default GameMap;
