import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistance } from '@/utils/gameUtils';

interface GameMapProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  actualLocation?: { lat: number; lng: number };
  distanceUnit: 'km' | 'miles';
  showDistance?: boolean;
  userAvatar?: string; // Add user avatar prop
  className?: string;
}

// Custom marker icon creation function using user avatar
const createCustomMarkerIcon = (avatarUrl: string | undefined) => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute -translate-x-1/2 -translate-y-full">
          <div class="h-8 w-8 rounded-full border-2 border-white shadow-md overflow-hidden">
            <img src="${avatarUrl || '/placeholder.svg'}" class="h-full w-full object-cover" alt="User location" />
          </div>
          <div class="h-3 w-3 bg-primary rounded-full absolute left-1/2 -translate-x-1/2 -bottom-1 border-2 border-white"></div>
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

// Create target marker icon for actual location
const targetIcon = L.divIcon({
  html: `
    <div class="relative">
      <div class="absolute -translate-x-1/2 -translate-y-full">
        <div class="h-8 w-8 flex items-center justify-center rounded-full bg-red-500 border-2 border-white shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
      </div>
    </div>
  `,
  className: 'custom-div-icon',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

const GameMap = ({
  selectedLocation,
  onLocationSelect,
  actualLocation,
  distanceUnit,
  showDistance = false,
  userAvatar, // Add user avatar prop
  className = ''
}: GameMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const targetMarker = useRef<L.Marker | null>(null);
  const polyline = useRef<L.Polyline | null>(null);
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: [0, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map.current);
    
    // Handle map click to select location
    map.current.on('click', (e: L.LeafletMouseEvent) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  // Update map view when actualLocation changes
  useEffect(() => {
    if (!map.current) return;
    
    if (actualLocation) {
      map.current.setView([actualLocation.lat, actualLocation.lng], 5);
    }
  }, [actualLocation]);
  
  // Update marker creation to use the user's avatar
  useEffect(() => {
    if (!map.current) return;
    
    // Clear existing markers
    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }
    
    // Add user marker with avatar if a location is selected
    if (selectedLocation) {
      userMarker.current = L.marker(
        [selectedLocation.lat, selectedLocation.lng],
        { icon: createCustomMarkerIcon(userAvatar) }
      ).addTo(map.current);
    }
    
    // Clear existing target marker and polyline
    if (targetMarker.current) {
      targetMarker.current.remove();
      targetMarker.current = null;
    }
    if (polyline.current) {
      polyline.current.remove();
      polyline.current = null;
    }
    
    // Add target marker and polyline if actual location is available and showDistance is true
    if (actualLocation && selectedLocation && showDistance) {
      targetMarker.current = L.marker(
        [actualLocation.lat, actualLocation.lng],
        { icon: targetIcon }
      ).addTo(map.current);
      
      // Draw polyline between selected location and actual location
      polyline.current = L.polyline(
        [
          [selectedLocation.lat, selectedLocation.lng],
          [actualLocation.lat, actualLocation.lng]
        ],
        { color: 'red', weight: 3, dashArray: '5,10' }
      ).addTo(map.current);
    }
  }, [selectedLocation, actualLocation, distanceUnit, showDistance, userAvatar]);
  
  return (
    <div className={`h-full w-full ${className}`} ref={mapContainer} />
  );
};

export default GameMap;
