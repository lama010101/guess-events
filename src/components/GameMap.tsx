
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

// Fix the missing icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom avatar marker
const createAvatarIcon = (avatarUrl: string | null) => {
  return L.divIcon({
    className: 'custom-avatar-marker',
    html: `<div class="avatar-container">
      <img src="${avatarUrl || 'https://ui-avatars.com/api/?name=User&background=random'}" 
      alt="User" class="avatar-image" />
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });
};

// Style the avatar marker via CSS
const createMapStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .custom-avatar-marker {
      background: none;
      border: none;
    }
    
    .avatar-container {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .correct-marker-icon {
      background-color: #10b981;
      border: 2px solid white;
      width: 20px !important;
      height: 20px !important;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
    .hint-circle {
      stroke-dasharray: 5, 5;
      stroke: #f59e0b;
      fill: #f59e0b;
      fill-opacity: 0.1;
    }
  `;
  document.head.appendChild(style);
};

const GameMap: React.FC<GameMapProps> = ({ 
  onLocationSelect, 
  selectedLocation, 
  correctLocation,
  showCorrectPin = false,
  isDisabled = false,
  userAvatar = null,
  locationHint,
  disableScroll = false
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const correctMarkerRef = useRef<L.Marker | null>(null);
  const hintCircleRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    createMapStyles();
    
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
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
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onLocationSelect, isDisabled, disableScroll]);
  
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
      // Create a custom icon for the correct location
      const correctIcon = L.divIcon({
        className: 'correct-marker-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
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

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-md overflow-hidden"></div>
  );
};

export default GameMap;
