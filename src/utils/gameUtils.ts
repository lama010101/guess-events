
import { HistoricalEvent, PlayerGuess, RoundResult } from "../types/game";

// Haversine formula to calculate distance between two points on Earth
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function convertToMiles(km: number): number {
  return km * 0.621371;
}

// Calculate location score based on distance in km - using the formula from specs
export function calculateLocationScore(distanceInKm: number): number {
  return Math.max(0, Math.round(5000 - Math.min(5000, 2.5 * Math.pow(distanceInKm, 0.85))));
}

// Calculate time score based on year difference - using the formula from specs
export function calculateTimeScore(yearDifference: number): number {
  return Math.max(0, Math.round(5000 - Math.min(5000, 400 * Math.pow(yearDifference, 0.9))));
}

// Calculate complete round results
export function calculateRoundResult(
  event: HistoricalEvent,
  guess: PlayerGuess,
  hintsUsed?: { time: boolean; location: boolean }
): RoundResult {
  const distanceError = calculateDistance(
    event.location.lat,
    event.location.lng,
    guess.location.lat,
    guess.location.lng
  );
  
  const yearError = Math.abs(event.year - guess.year);
  
  const locationScore = calculateLocationScore(distanceError);
  const timeScore = calculateTimeScore(yearError);
  
  return {
    event,
    guess,
    distanceError,
    yearError,
    locationScore,
    timeScore,
    totalScore: locationScore + timeScore,
    hintsUsed
  };
}

// Generate a location hint region
export function generateLocationHint(location: { lat: number; lng: number }): { lat: number; lng: number; radiusKm: number } {
  // Create a hint that's within a reasonable distance of the actual location
  // The radius should be challenging but helpful
  const radiusKm = Math.random() * 300 + 200; // Random radius between 200-500km
  
  return {
    lat: location.lat,
    lng: location.lng,
    radiusKm
  };
}

// Generate a time hint range
export function generateTimeHint(
  actualYear: number, 
  minYear: number = 1900, 
  maxYear: number = new Date().getFullYear()
): { min: number; max: number } {
  // Create a range that's half the size of the original range and includes the actual year
  const totalRange = maxYear - minYear;
  const halfRange = Math.floor(totalRange / 4); // Quarter the range size to make it more helpful
  
  // Ensure the actual year is within the hint range
  let minHintYear = Math.max(minYear, actualYear - halfRange);
  let maxHintYear = Math.min(maxYear, actualYear + halfRange);
  
  // If the actual year is close to the boundaries, adjust the range
  if (actualYear - minHintYear < halfRange / 2) {
    maxHintYear = Math.min(maxYear, minHintYear + halfRange);
  } else if (maxHintYear - actualYear < halfRange / 2) {
    minHintYear = Math.max(minYear, maxHintYear - halfRange);
  }
  
  return { min: minHintYear, max: maxHintYear };
}

// Shuffle an array of events to randomize game order
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Format a number with commas for thousands
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Check if a game is in daily mode
export function isDailyMode(results: RoundResult[]): boolean {
  return results.length > 0 && results[0].event.gameMode === 'daily';
}
