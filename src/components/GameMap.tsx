
import React, { useRef, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [correctMarker, setCorrectMarker] = useState<google.maps.Marker | null>(null);
  const [line, setLine] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const googleMapsScript = document.createElement('script');
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBsY7TWsifdT-O81OSRxOhGbmT-Mnns2sE&callback=initMap`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      window.initMap = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(googleMapsScript);
    };

    if (!window.google) {
      loadGoogleMapsScript();
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstance) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "administrative",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      setMapInstance(map);

      if (!isDisabled) {
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && !isDisabled) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onLocationSelect(lat, lng);
          }
        });
      }
    }
  }, [mapLoaded, onLocationSelect, mapInstance, isDisabled]);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (mapInstance && selectedLocation) {
      // Remove existing marker if it exists
      if (marker) {
        marker.setMap(null);
      }

      // Create new marker
      const newMarker = new google.maps.Marker({
        position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        },
      });

      setMarker(newMarker);
    }
  }, [selectedLocation, mapInstance]);

  // Show correct location and line if provided
  useEffect(() => {
    if (mapInstance && correctLocation) {
      // Show correct marker
      if (correctMarker) {
        correctMarker.setMap(null);
      }

      const newCorrectMarker = new google.maps.Marker({
        position: { lat: correctLocation.lat, lng: correctLocation.lng },
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        },
      });

      setCorrectMarker(newCorrectMarker);

      // Draw line between guess and correct location if we have both
      if (selectedLocation) {
        if (line) {
          line.setMap(null);
        }

        const newLine = new google.maps.Polyline({
          path: [
            { lat: selectedLocation.lat, lng: selectedLocation.lng },
            { lat: correctLocation.lat, lng: correctLocation.lng }
          ],
          geodesic: true,
          strokeColor: '#ef4444',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map: mapInstance
        });

        setLine(newLine);

        // Fit bounds to show both markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng));
        bounds.extend(new google.maps.LatLng(correctLocation.lat, correctLocation.lng));
        mapInstance.fitBounds(bounds, 50); // 50px padding
      }
    }
  }, [correctLocation, selectedLocation, mapInstance]);

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
