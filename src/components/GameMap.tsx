
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GameMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  correctLocation?: { lat: number; lng: number } | null;
  isDisabled?: boolean;
}

// TEMPORARY API KEY - Replace with your own Mapbox token
// In production, this should be stored in environment variables
mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNsdDhucG8zcDBkODYyanBsNjJpZXJ6MHUifQ.a6LbYP9bx42myWdegExiIg';

const GameMap: React.FC<GameMapProps> = ({ 
  onLocationSelect, 
  selectedLocation, 
  correctLocation, 
  isDisabled = false 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const [correctMarker, setCorrectMarker] = useState<mapboxgl.Marker | null>(null);
  const [line, setLine] = useState<mapboxgl.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 20],
      zoom: 1.5,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (!isDisabled) {
      map.on('click', (e) => {
        if (!isDisabled) {
          onLocationSelect(e.lngLat.lat, e.lngLat.lng);
        }
      });
    }

    setMapInstance(map);

    return () => {
      map.remove();
    };
  }, [isDisabled, onLocationSelect, mapInstance]);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (mapInstance && selectedLocation) {
      // Remove existing marker if it exists
      if (marker) {
        marker.remove();
      }

      // Create new marker
      const newMarker = new mapboxgl.Marker({
        color: '#3b82f6',
      })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(mapInstance);

      setMarker(newMarker);
    }
  }, [selectedLocation, mapInstance]);

  // Show correct location and line if provided
  useEffect(() => {
    if (mapInstance && correctLocation) {
      // Show correct marker
      if (correctMarker) {
        correctMarker.remove();
      }

      const newCorrectMarker = new mapboxgl.Marker({
        color: '#10b981',
      })
        .setLngLat([correctLocation.lng, correctLocation.lat])
        .addTo(mapInstance);

      setCorrectMarker(newCorrectMarker);

      // Draw line between guess and correct location if we have both
      if (selectedLocation && line) {
        // In Mapbox we need to remove old layer and source
        const lineSourceId = 'line-source';
        const lineLayerId = 'line-layer';
        
        if (mapInstance.getLayer(lineLayerId)) {
          mapInstance.removeLayer(lineLayerId);
        }
        
        if (mapInstance.getSource(lineSourceId)) {
          mapInstance.removeSource(lineSourceId);
        }
      }

      // Add line between markers if both exist
      if (selectedLocation && mapInstance.isStyleLoaded()) {
        mapInstance.addSource('line-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [selectedLocation.lng, selectedLocation.lat],
                [correctLocation.lng, correctLocation.lat]
              ]
            }
          }
        });

        mapInstance.addLayer({
          id: 'line-layer',
          type: 'line',
          source: 'line-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ef4444',
            'line-width': 2,
            'line-dasharray': [2, 1]
          }
        });

        // Fit bounds to show both markers
        const bounds = new mapboxgl.LngLatBounds()
          .extend([selectedLocation.lng, selectedLocation.lat])
          .extend([correctLocation.lng, correctLocation.lat]);

        mapInstance.fitBounds(bounds, { padding: 50 });
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
