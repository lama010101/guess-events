
import { HistoricalEvent, PlayerGuess, RoundResult } from '@/types/game';

// Function to calculate the distance between two coordinates using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export function getDistanceInUnit(distanceKm: number, unit: 'km' | 'miles'): number {
  return unit === 'km' ? distanceKm : convertToMiles(distanceKm);
}

export function calculateTotalScore(roundResults: RoundResult[]): number {
  return roundResults.reduce((acc, result) => acc + (result.totalScore || 0), 0);
}

export function calculateRoundResult(event: HistoricalEvent, guess: PlayerGuess): RoundResult {
  if (!guess.location) {
    const yearError = Math.abs(event.year - guess.year);
    const timeScore = Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9))));
    
    return {
      event,
      guess,
      distanceError: Infinity,
      yearError,
      locationScore: 0,
      timeScore,
      totalScore: timeScore,
      achievements: {
        perfectTime: yearError === 0
      }
    };
  }

  // Calculate distance error in kilometers
  const distanceError = calculateDistance(
    guess.location.lat,
    guess.location.lng,
    event.location.lat,
    event.location.lng
  );

  // Calculate year error
  const yearError = Math.abs(event.year - guess.year);

  // Calculate location score (out of 5000)
  // Max distance error we consider is 10000 km
  const maxDistanceError = 10000;
  const locationScore = Math.max(0, Math.round(5000 - Math.min(5000, 5000 * Math.pow(distanceError / maxDistanceError, 0.6))));

  // Calculate time score (out of 5000)
  // Score decreases more rapidly for recent years vs ancient years
  const timeScore = Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearError, 0.9))));

  // Calculate total score
  const totalScore = locationScore + timeScore;

  // Determine if any achievements were earned
  const isPerfectLocation = distanceError < 0.05; // Less than 50 meters
  const isPerfectTime = yearError === 0;
  const isPerfect = isPerfectLocation && isPerfectTime;

  return {
    event,
    guess,
    distanceError,
    yearError,
    locationScore,
    timeScore,
    totalScore,
    achievements: {
      perfectLocation: isPerfectLocation,
      perfectTime: isPerfectTime,
      perfect: isPerfect
    }
  };
}
