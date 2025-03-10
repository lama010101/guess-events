
import React, { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GameMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number } | null;
  isDisabled?: boolean;
}

const GameMap: React.FC<GameMapProps> = ({ 
  onLocationSelect, 
  selectedLocation, 
  correctLocation, 
  isDisabled = false 
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
      // Create custom icon
      const blueIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        shadowSize: [41, 41]
      });

      const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        shadowSize: [41, 41]
      });

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
        const blueIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          shadowSize: [41, 41]
        });

        const newMarker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: blueIcon })
          .addTo(mapInstanceRef.current);

        setMarker(newMarker);
      } catch (error) {
        console.error("Error adding marker:", error);
      }
    }
  }, [selectedLocation, mapLoaded]);

  // Show correct location and line if provided
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !correctLocation) return;

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
      const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        shadowSize: [41, 41]
      });

      const newCorrectMarker = L.marker([correctLocation.lat, correctLocation.lng], { icon: greenIcon })
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

        // Fit bounds to show both markers
        const bounds = L.latLngBounds(
          [selectedLocation.lat, selectedLocation.lng],
          [correctLocation.lat, correctLocation.lng]
        );

        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Error adding correct marker or line:", error);
    }
  }, [correctLocation, selectedLocation, mapLoaded]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md">
      <div ref={mapRef} className="w-full h-full" />
      {!selectedLocation && !isDisabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm">
          Click on the map to place your guess
        </div>
      )}
    </div>
  );
};

export default GameMap;
