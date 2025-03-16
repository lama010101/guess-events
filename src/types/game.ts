
export interface Location {
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  name?: string;
}

export interface Event {
  id: string;
  title?: string;
  description: string;
  year: number;
  image_url: string;
  location: Location;
  source?: string;
  round_number?: number;
  gameMode?: 'daily' | 'friends' | 'single';
}

export interface GameSettings {
  distanceUnit: 'km' | 'miles';
  timerEnabled: boolean;
  timerDuration: number;
  gameMode: 'daily' | 'friends' | 'single';
  hintsEnabled: boolean;
  maxHints: number;
}

export interface RoundResult {
  event: Event;
  selectedLocation: { lat: number; lng: number };
  selectedYear: number;
  distanceKm: number;
  distanceError?: number; // Added for backward compatibility
  yearDifference: number;
  yearError?: number; // Added for backward compatibility
  locationScore: number;
  yearScore: number;
  timeScore?: number;
  timeBonus?: number;
  totalScore: number;
  hintsUsed: { 
    time: boolean;
    location: boolean;
  };
  guess?: PlayerGuess;
  achievements?: { 
    perfectLocation?: boolean;
    perfectTime?: boolean;
    perfect?: boolean;
  };
}

export interface GameState {
  gameStatus: 'not-started' | 'in-progress' | 'round-result' | 'game-over';
  events: Event[];
  currentRound: number;
  totalRounds: number;
  currentEvent: Event | null;
  selectedLocation: { lat: number; lng: number } | null;
  selectedYear: number | null;
  roundResults: RoundResult[];
  userAvatar: string | null;
  settings: GameSettings;
  hintsUsed: { 
    time: boolean;
    location: boolean;
  };
  hintsAvailable: number;
  gameSessionId: string | null;
  sessionUrl: string | null;
  currentGuess?: PlayerGuess | null;
  hints?: {
    available: number;
    timeHintUsed: boolean;
    locationHintUsed: boolean;
    timeHintRange?: { min: number; max: number };
    locationHintRegion?: { lat: number; lng: number; radiusKm: number };
  };
  timerStartTime?: number;
  timerRemaining?: number;
}

// Add HistoricalEvent type for backward compatibility
export interface HistoricalEvent {
  id: string;
  year: number;
  description: string;
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  gameMode?: 'daily' | 'friends' | 'single';
}

// Add PlayerGuess type for backward compatibility
export interface PlayerGuess {
  location: { lat: number; lng: number } | null;
  year: number;
}

// Helper function to convert between Event and HistoricalEvent
export function convertToHistoricalEvent(event: Event): HistoricalEvent {
  return {
    id: event.id,
    year: event.year,
    description: event.description,
    imageUrl: event.image_url,
    location: {
      lat: event.location.lat,
      lng: event.location.lng,
      name: event.location.name || event.location.country || ''
    },
    gameMode: event.gameMode
  };
}

export function convertToEvent(historicalEvent: HistoricalEvent): Event {
  return {
    id: historicalEvent.id,
    year: historicalEvent.year,
    description: historicalEvent.description,
    image_url: historicalEvent.imageUrl,
    location: {
      lat: historicalEvent.location.lat,
      lng: historicalEvent.location.lng,
      name: historicalEvent.location.name,
      country: historicalEvent.location.name.split(', ')[1] || ''
    },
    gameMode: historicalEvent.gameMode
  };
}
