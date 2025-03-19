
import React from 'react';
import { Compass } from 'lucide-react';

interface LocationResultProps {
  distance: number;
  unit: 'km' | 'mi';
  showIcon?: boolean;
}

const LocationResult: React.FC<LocationResultProps> = ({ 
  distance, 
  unit,
  showIcon = true
}) => {
  // Format the distance based on the magnitude
  const formattedDistance = React.useMemo(() => {
    // For very small distances, show in meters or feet
    if (unit === 'km' && distance < 1) {
      // Convert to meters
      const meters = Math.round(distance * 1000);
      return `${meters} meters`;
    } else if (unit === 'mi' && distance < 1) {
      // Convert to feet (1 mile = 5280 feet)
      const feet = Math.round(distance * 5280);
      return `${feet} feet`;
    }
    
    // For larger distances, format with 1 decimal place
    if (unit === 'km') {
      return `${distance.toFixed(1)} km`;
    } else {
      // Convert to miles and format
      const miles = distance * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
  }, [distance, unit]);

  return (
    <div className="flex items-center gap-2">
      {showIcon && <Compass className="h-5 w-5 text-indigo-500" />}
      <span className="font-medium">{formattedDistance}</span>
    </div>
  );
};

export default LocationResult;
