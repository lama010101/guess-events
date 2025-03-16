
export interface Location {
  lat: number;
  lng: number;
  country?: string;
  city?: string;
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
  yearDifference: number;
  locationScore: number;
  yearScore: number;
  timeBonus: number;
  totalScore: number;
  hintsUsed: { 
    time: boolean;
    location: boolean;
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
}
