
import React from 'react';
import { formatNumber, convertToMiles } from '@/utils/gameUtils';

interface LocationResultProps {
  distanceError: number;
  locationScore: number;
  locationName: string;
  isPerfectLocation: boolean;
  distanceUnit: 'km' | 'miles';
  locationHintUsed?: boolean;
}

const LocationResult: React.FC<LocationResultProps> = ({
  distanceError,
  locationScore,
  locationName,
  isPerfectLocation,
  distanceUnit,
  locationHintUsed
}) => {
  const formatDistance = () => {
    if (distanceError === Infinity) return "N/A";
    
    // For very small distances (less than 1 km or mile)
    if (distanceError < 1) {
      // Convert to meters or feet
      const smallDistanceValue = distanceUnit === 'km' 
        ? Math.round(distanceError * 1000) // Convert km to meters 
        : Math.round(convertToMiles(distanceError) * 5280); // Convert miles to feet
      
      const unit = distanceUnit === 'km' ? 'meters' : 'feet';
      return `${formatNumber(smallDistanceValue)} ${unit}`;
    }
    
    // For regular distances
    const value = distanceUnit === 'km' 
      ? Math.round(distanceError) 
      : Math.round(convertToMiles(distanceError));
      
    return `${formatNumber(value)} ${distanceUnit}`;
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-2">Location</h3>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your guess was</p>
          {isPerfectLocation ? (
            <p className="font-medium text-green-500">Perfect!</p>
          ) : (
            <p className="font-medium">{formatDistance()} away</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Correct location: {locationName}
          </p>
          
          {locationHintUsed && (
            <p className="text-xs text-orange-500 mt-1">
              Used location hint
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
          <p className="font-medium">{formatNumber(locationScore)}</p>
        </div>
      </div>
    </div>
  );
};

export default LocationResult;
