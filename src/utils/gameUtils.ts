
import { Event, RoundResult, PlayerGuess, HistoricalEvent } from '@/types/game';

// Function to calculate the distance between two coordinates using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const lat1Rad = Math.PI / 180 * lat1;
  const lat2Rad = Math.PI / 180 * lat2;
  const deltaLatRad = Math.PI / 180 * (lat2 - lat1);
  const deltaLonRad = Math.PI / 180 * (lon2 - lon1);

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

export function convertToMiles(km: number): number {
  return km * 0.621371;
}

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function calculateRoundResult(event: Event | HistoricalEvent, guess: PlayerGuess): RoundResult {
  // Handle different property names between Event and HistoricalEvent
  const eventLoc = 'location' in event ? event.location : 
    { lat: 0, lng: 0, name: '' }; // This should never happen but TypeScript needs a fallback
  
  const eventYear = event.year;
  const eventDesc = event.description;
  const eventImage = 'image_url' in event ? event.image_url : 
    ('imageUrl' in event ? (event as HistoricalEvent).imageUrl : '');
  const eventId = event.id;
  
  // Create a properly formatted Event object
  const formattedEvent: Event = {
    id: eventId,
    year: eventYear,
    description: eventDesc,
    image_url: eventImage,
    location: {
      lat: eventLoc.lat,
      lng: eventLoc.lng,
      name: eventLoc.name || ''
    }
  };
  
  if (!guess.location) {
    const yearDifference = Math.abs(eventYear - guess.year);
    const yearScore = Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearDifference, 0.9))));
    
    return {
      event: formattedEvent,
      selectedLocation: { lat: 0, lng: 0 }, // Default values
      selectedYear: guess.year,
      distanceKm: Infinity,
      yearDifference: yearDifference,
      locationScore: 0,
      yearScore: yearScore,
      timeScore: yearScore, // For backward compatibility
      totalScore: yearScore,
      hintsUsed: {
        time: false,
        location: false
      },
      guess: guess,
      achievements: {
        perfectTime: yearDifference === 0
      }
    };
  }

  // Calculate distance error in kilometers
  const distanceError = getDistance(
    guess.location.lat,
    guess.location.lng,
    eventLoc.lat,
    eventLoc.lng
  );

  // Calculate year error
  const yearDifference = Math.abs(eventYear - guess.year);

  // Calculate location score (out of 5000)
  // Max distance error we consider is 10000 km
  const maxDistanceError = 10000;
  const locationScore = Math.max(0, Math.round(5000 - Math.min(5000, 5000 * Math.pow(distanceError / maxDistanceError, 0.6))));

  // Calculate time score (out of 5000)
  // Score decreases more rapidly for recent years vs ancient years
  const yearScore = Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearDifference, 0.9))));

  // Calculate total score
  const totalScore = locationScore + yearScore;

  // Determine if any achievements were earned
  const isPerfectLocation = distanceError < 10; // Less than 10 kilometers
  const isPerfectTime = yearDifference === 0;
  const isPerfect = isPerfectLocation && isPerfectTime;

  return {
    event: formattedEvent,
    selectedLocation: guess.location,
    selectedYear: guess.year,
    distanceKm: distanceError,
    distanceError: distanceError, // For backward compatibility
    yearDifference,
    yearError: yearDifference, // For backward compatibility
    locationScore,
    yearScore,
    timeScore: yearScore, // For backward compatibility
    totalScore,
    hintsUsed: {
      time: false,
      location: false
    },
    guess,
    achievements: {
      perfectLocation: isPerfectLocation,
      perfectTime: isPerfectTime,
      perfect: isPerfect
    }
  };
}
