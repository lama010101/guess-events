
import { useRef, useEffect } from 'react';
import L from 'leaflet';
import { setupLeafletIcons, createAvatarIcon, createCorrectLocationIcon } from '@/utils/mapUtils';

interface UseMapInteractionProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number; name: string };
  showCorrectPin?: boolean;
  isDisabled?: boolean;
  userAvatar?: string | null;
  locationHint?: { lat: number; lng: number; radiusKm: number } | undefined;
  disableScroll?: boolean;
}

export const useMapInteraction = ({
  onLocationSelect,
  selectedLocation,
  correctLocation,
  showCorrectPin = false,
  isDisabled = false,
  userAvatar = null,
  locationHint,
  disableScroll = false
}: UseMapInteractionProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const correctMarkerRef = useRef<L.Marker | null>(null);
  const hintCircleRef = useRef<L.Circle | null>(null);
  
  // Initialize map
  useEffect(() => {
    setupLeafletIcons();
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Setup map when container is available
  const initializeMap = (container: HTMLDivElement) => {
    if (!container || mapRef.current) return;
    
    // Initialize map
    const map = L.map(container, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: !disableScroll,
      dragging: !disableScroll || !isDisabled
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    mapRef.current = map;
    
    // Add click event if not disabled
    if (!isDisabled) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      });
    }
  };
  
  // Update marker when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    
    // Add new marker if location is selected
    if (selectedLocation) {
      const icon = createAvatarIcon(userAvatar);
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon }).addTo(mapRef.current);
      markerRef.current = marker;
      
      // Center map on the marker
      if (!showCorrectPin) {
        mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], mapRef.current.getZoom());
      }
    }
  }, [selectedLocation, userAvatar, showCorrectPin]);
  
  // Show correct pin when requested
  useEffect(() => {
    if (!mapRef.current || !correctLocation) return;
    
    // Remove existing correct marker
    if (correctMarkerRef.current) {
      correctMarkerRef.current.remove();
      correctMarkerRef.current = null;
    }
    
    if (showCorrectPin) {
      const correctIcon = createCorrectLocationIcon();
      
      const correctMarker = L.marker([correctLocation.lat, correctLocation.lng], { 
        icon: correctIcon,
        zIndexOffset: 1000 // Ensure it's on top
      })
        .addTo(mapRef.current)
        .bindTooltip(correctLocation.name);
      
      correctMarkerRef.current = correctMarker;
      
      // If both markers exist, set bounds to show both
      if (markerRef.current) {
        const bounds = L.latLngBounds(
          [correctLocation.lat, correctLocation.lng],
          [selectedLocation!.lat, selectedLocation!.lng]
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // If only correct marker exists, center on it
        mapRef.current.setView([correctLocation.lat, correctLocation.lng], 5);
      }
    }
  }, [correctLocation, showCorrectPin, selectedLocation]);
  
  // Handle location hint
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Remove existing hint circle
    if (hintCircleRef.current) {
      hintCircleRef.current.remove();
      hintCircleRef.current = null;
    }
    
    if (locationHint) {
      const circle = L.circle([locationHint.lat, locationHint.lng], {
        radius: locationHint.radiusKm * 1000, // Convert km to meters
        className: 'hint-circle'
      }).addTo(mapRef.current);
      
      hintCircleRef.current = circle;
      
      // Zoom to show the circle
      mapRef.current.fitBounds(circle.getBounds(), { padding: [50, 50] });
    }
  }, [locationHint]);
  
  // Update scroll wheel when disableScroll changes
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
