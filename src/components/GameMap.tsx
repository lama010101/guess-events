
import React, { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GameMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number } | null;
  isDisabled?: boolean;
  showCorrectPin?: boolean;
  userAvatar?: string | null;
}

const GameMap: React.FC<GameMapProps> = ({ 
  onLocationSelect, 
  selectedLocation, 
  correctLocation, 
  isDisabled = false,
  showCorrectPin = false,
  userAvatar = null
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [correctMarker, setCorrectMarker] = useState<L.Marker | null>(null);
  const [polyline, setPolyline] = useState<L.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          })
        ]
      });

      // Add click event
      map.on('click', (e) => {
        if (!isDisabled) {
          console.log("Map clicked at:", e.latlng);
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
      console.log("Map loaded successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isDisabled, onLocationSelect]);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    
    if (selectedLocation) {
      console.log("Updating marker with location:", selectedLocation);
      
      // Remove existing marker if it exists
      if (marker) {
        marker.remove();
      }

      // Create new marker
      try {
        // Create custom user avatar icon if available
        let markerIcon;
        
        if (userAvatar) {
          // Create a custom icon with user's avatar
          const avatarHtml = `
            <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 3px solid #3b82f6; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <img src="${userAvatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="User avatar" />
            </div>
          `;
          
          markerIcon = L.divIcon({
            html: avatarHtml,
            className: 'custom-avatar-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          });
        } else {
          // Use default blue marker
          markerIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [41, 41]
          });
        }

        // CRITICAL FIX: Add marker at location without changing view
        const newMarker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: markerIcon })
          .addTo(mapInstanceRef.current);

        setMarker(newMarker);
        
        // Explicitly DO NOT reset the view, keep the current view
        // No mapInstanceRef.current.fitBounds or setView calls here
      } catch (error) {
        console.error("Error adding marker:", error);
      }
    }
  }, [selectedLocation, mapLoaded, userAvatar]);

  // Show correct location and line if provided
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !correctLocation || !showCorrectPin) return;

    console.log("Adding correct location marker:", correctLocation);
    
    // Show correct marker
    if (correctMarker) {
      correctMarker.remove();
    }

    // Remove existing polyline
    if (polyline) {
      polyline.remove();
      setPolyline(null);
    }

    try {
      // Use a custom "correct" icon with a checkmark
      const correctIconHtml = `
        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #22c55e; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 3px solid white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      `;
      
      const correctDivIcon = L.divIcon({
        html: correctIconHtml,
        className: 'correct-location-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const newCorrectMarker = L.marker([correctLocation.lat, correctLocation.lng], { icon: correctDivIcon })
        .addTo(mapInstanceRef.current);

      setCorrectMarker(newCorrectMarker);

      // Add line between markers if both exist
      if (selectedLocation && mapInstanceRef.current) {
        const newPolyline = L.polyline(
          [
            [selectedLocation.lat, selectedLocation.lng],
            [correctLocation.lat, correctLocation.lng]
          ],
          { 
            color: '#ef4444',
            weight: 2,
            dashArray: '5, 5',
            opacity: 0.7
          }
        ).addTo(mapInstanceRef.current);
        
        setPolyline(newPolyline);

        // Fit bounds to show both markers - this is only for the results screen
        // so it's okay to change the view here
        const bounds = L.latLngBounds(
          [selectedLocation.lat, selectedLocation.lng],
          [correctLocation.lat, correctLocation.lng]
        );

        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Error adding correct marker or line:", error);
    }
  }, [correctLocation, selectedLocation, mapLoaded, showCorrectPin]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md">
      <div ref={mapRef} className="w-full h-full" />
      {!selectedLocation && !isDisabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm z-10">
          Click on the map to place your guess
        </div>
      )}
    </div>
  );
};

export default GameMap;
