import { useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { setupLeafletIcons, createAvatarIcon, createCorrectLocationIcon } from '@/utils/mapUtils';

interface UseMapInteractionProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number; name: string };
  showCorrectPin?: boolean;
  showConnectingLine?: boolean;
  isDisabled?: boolean;
  userAvatar?: string | null;
  locationHint?: { 
    lat: number; 
    lng: number; 
    country: string;
    radiusKm?: number; 
  };
  disableScroll?: boolean;
  correctLocationIcon?: React.ReactNode;
}

export const useMapInteraction = ({
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
}: UseMapInteractionProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const correctMarkerRef = useRef<L.Marker | null>(null);
  const hintCircleRef = useRef<L.Circle | null>(null);
  const connectionLineRef = useRef<L.Polyline | null>(null);
  
  useEffect(() => {
    setupLeafletIcons();
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const drawConnectingLine = useCallback(() => {
    if (!mapRef.current || !selectedLocation || !correctLocation || !showConnectingLine) return;
    
    if (connectionLineRef.current) {
      connectionLineRef.current.remove();
      connectionLineRef.current = null;
    }
    
    const line = L.polyline(
      [
        [selectedLocation.lat, selectedLocation.lng],
        [correctLocation.lat, correctLocation.lng]
      ],
      { 
        color: '#6366F1',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5',
        lineCap: 'round'
      }
    ).addTo(mapRef.current);
    
    connectionLineRef.current = line;
  }, [selectedLocation, correctLocation, showConnectingLine]);

  const initializeMap = useCallback((container: HTMLDivElement) => {
    if (!container || mapRef.current) return;
    
    const map = L.map(container, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: !disableScroll,
      dragging: !disableScroll || !isDisabled,
      touchZoom: true,
      doubleClickZoom: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    mapRef.current = map;
    
    if (!isDisabled) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      });
    }
  }, [disableScroll, isDisabled, onLocationSelect]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    
    if (selectedLocation) {
      const icon = createAvatarIcon(userAvatar);
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon }).addTo(mapRef.current);
      markerRef.current = marker;
      
      if (!showCorrectPin) {
        mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], mapRef.current.getZoom());
      }
    }
    
    drawConnectingLine();
  }, [selectedLocation, userAvatar, showCorrectPin, drawConnectingLine]);

  useEffect(() => {
    if (!mapRef.current || !correctLocation) return;
    
    if (correctMarkerRef.current) {
      correctMarkerRef.current.remove();
      correctMarkerRef.current = null;
    }
    
    if (showCorrectPin) {
      const correctIcon = createCorrectLocationIcon(correctLocationIcon);
      
      const correctMarker = L.marker([correctLocation.lat, correctLocation.lng], { 
        icon: correctIcon,
        zIndexOffset: 1000
      })
        .addTo(mapRef.current)
        .bindTooltip(correctLocation.name);
      
      correctMarkerRef.current = correctMarker;
      
      if (markerRef.current) {
        const bounds = L.latLngBounds(
          [correctLocation.lat, correctLocation.lng],
          [selectedLocation!.lat, selectedLocation!.lng]
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapRef.current.setView([correctLocation.lat, correctLocation.lng], 5);
      }
      
      drawConnectingLine();
    }
  }, [correctLocation, showCorrectPin, selectedLocation, drawConnectingLine, correctLocationIcon]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    if (hintCircleRef.current) {
      hintCircleRef.current.remove();
      hintCircleRef.current = null;
    }
    
    if (locationHint) {
      const radius = locationHint.radiusKm ? locationHint.radiusKm * 1000 : 100000;
      const circle = L.circle([locationHint.lat, locationHint.lng], {
        radius: radius,
        className: 'hint-circle'
      }).addTo(mapRef.current);
      
      hintCircleRef.current = circle;
      
      mapRef.current.fitBounds(circle.getBounds(), { padding: [50, 50] });
    }
  }, [locationHint]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    if (disableScroll) {
      mapRef.current.scrollWheelZoom.disable();
      if (isDisabled) {
        mapRef.current.dragging.disable();
      }
    } else {
      mapRef.current.scrollWheelZoom.enable();
      mapRef.current.dragging.enable();
    }
  }, [disableScroll, isDisabled]);

  return { initializeMap };
};

export default useMapInteraction;
