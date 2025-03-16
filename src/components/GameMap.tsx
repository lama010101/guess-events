
import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface GameMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  actualLocation?: { lat: number; lng: number } | null;
  regionHint?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showUserAvatar?: boolean;
  userAvatar?: string | null;
  isStatic?: boolean;
}

const GameMap: React.FC<GameMapProps> = ({
  onLocationSelect,
  selectedLocation,
  actualLocation,
  regionHint,
  isFullscreen,
  onToggleFullscreen,
  showUserAvatar = false,
  userAvatar = null,
  isStatic = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const actualMarkerRef = useRef<L.Marker | null>(null);
  const [mapHeight, setMapHeight] = useState('40vh');
  
  // Initialize map on component mount
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    
    // Create map
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: !isStatic,
      dragging: !isStatic,
      touchZoom: !isStatic,
      doubleClickZoom: !isStatic,
      boxZoom: !isStatic,
      keyboard: !isStatic,
      zoomControl: !isStatic
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Adjust map height based on fullscreen status
    if (isFullscreen) {
      setMapHeight('calc(100vh - 200px)');
    }
    
    leafletMapRef.current = map;
    
    // Add click handler if not in static mode
    if (!isStatic && onLocationSelect) {
      map.on('click', (e) => {
        if (onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      });
    }
    
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isFullscreen, onLocationSelect, isStatic]);
  
  // Update marker when selected location changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    
    // Remove existing marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    
    if (selectedLocation) {
      // Create custom icon if avatar is available
      let icon: L.Icon | L.DivIcon;
      
      if (showUserAvatar && userAvatar) {
        icon = L.divIcon({
          html: `<div style="background-image: url('${userAvatar}'); width: 36px; height: 36px; border-radius: 50%; background-size: cover; border: 3px solid #3b82f6;"></div>`,
          className: 'custom-div-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
      } else {
        icon = new L.Icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });
      }
      
      // Add new marker
      userMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon })
        .addTo(leafletMapRef.current);
      
      // Pan to marker if not in static mode
      if (!isStatic) {
        leafletMapRef.current.panTo([selectedLocation.lat, selectedLocation.lng]);
      }
    }
  }, [selectedLocation, showUserAvatar, userAvatar, isStatic]);
  
  // Add actual location marker when revealed
  useEffect(() => {
    if (!leafletMapRef.current || !actualLocation) return;
    
    // Remove existing actual location marker
    if (actualMarkerRef.current) {
      actualMarkerRef.current.remove();
      actualMarkerRef.current = null;
    }
    
    // Create custom icon for actual location
    const actualIcon = L.divIcon({
      html: '<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>',
      className: 'custom-div-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    
    // Add marker for actual location
    actualMarkerRef.current = L.marker([actualLocation.lat, actualLocation.lng], { icon: actualIcon })
      .addTo(leafletMapRef.current);
    
    // If both markers exist, create a line between them
    if (selectedLocation && actualLocation) {
      const latlngs = [
        [selectedLocation.lat, selectedLocation.lng],
        [actualLocation.lat, actualLocation.lng]
      ];
      
      L.polyline(latlngs as L.LatLngExpression[], { color: '#3b82f6', dashArray: '5, 5' })
        .addTo(leafletMapRef.current);
      
      // Fit bounds to show both markers
      const bounds = L.latLngBounds([
        [selectedLocation.lat, selectedLocation.lng],
        [actualLocation.lat, actualLocation.lng]
      ]);
      
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [actualLocation, selectedLocation, isStatic]);
  
  // Add region hint if provided
  useEffect(() => {
    if (!leafletMapRef.current || !regionHint) return;
    
    // Add a circle or highlight for the region hint
    // Implementation depends on what kind of hint you want to show
    const popup = L.popup()
      .setLatLng([0, 0])
      .setContent(`<p>Region Hint: ${regionHint}</p>`)
      .openOn(leafletMapRef.current);
      
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.closePopup(popup);
      }
    };
  }, [regionHint]);
  
  return (
    <div className="relative w-full h-full">
      {onToggleFullscreen && (
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-2 right-2 z-[400]"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      )}
      <div 
        ref={mapRef} 
        style={{ height: mapHeight, width: '100%' }}
        className="z-0"
      />
    </div>
  );
};

export default GameMap;
