
export interface HistoricalEvent {
  id: string;
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  year: number;
  description: string;
  gameMode?: 'daily' | 'friends' | 'single';
  // Added fields for backward compatibility
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

export type Event = HistoricalEvent; // Alias for backward compatibility

export interface GameSettings {
  distanceUnit: 'km' | 'miles';
  timerEnabled: boolean;
  timerDuration: number; // in minutes
  gameMode: 'daily' | 'friends' | 'single';
  hintsEnabled: boolean;
  maxHints: number;
  maxRounds?: number; // Added for compatibility
}

export interface PlayerGuess {
  location: {
    lat: number;
    lng: number;
  } | null;
  year: number | null;
}

export interface RoundResult {
  event: HistoricalEvent;
  guess: PlayerGuess;
  distanceError: number; // in km
  yearError: number; // in years
  locationScore: number;
  timeScore: number;
  totalScore: number;
  // For backward compatibility
  distance?: number;
  score?: number;
  location?: {lat: number, lng: number};
  year?: number;
  eventId?: string;
  hintsUsed?: {
    time?: boolean;
    location?: boolean;
  };
  achievements?: {
    perfectLocation?: boolean;
    perfectTime?: boolean;
    perfect?: boolean;
  };
}

export interface GameState {
  settings: GameSettings;
  events: HistoricalEvent[];
  currentRound: number;
  totalRounds: number;
  roundResults: RoundResult[];
  gameStatus: 'not-started' | 'in-progress' | 'round-result' | 'game-over' | 'ready' | 'show-result' | 'completed' | 'loading';
  currentGuess: PlayerGuess | null;
  timerStartTime?: number; // timestamp when timer started
  timerRemaining?: number; // seconds remaining
  sessionId?: string; // unique ID for the game session
  userAvatar?: string | null; // user's profile picture
  hints: {
    available: number;
    timeHintUsed: boolean;
    locationHintUsed: boolean;
    timeHintRange?: { min: number, max: number };
    locationHintRegion?: { lat: number, lng: number, radiusKm: number };
    // For backward compatibility
    yearHintUsed?: boolean;
    used?: string[];
  };
  // Extra fields for backward compatibility
  selectedLocation?: {lat: number, lng: number} | null;
  selectedYear?: number | null;
  currentEvent?: HistoricalEvent;
  gameMode?: string;
  totalScore?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  friends: string[]; // Array of user IDs
  stats: {
    gamesPlayed: number;
    totalScore: number;
    averageScore: number;
    highestDailyScore: number;
  };
  preferences: {
    defaultDistanceUnit: 'km' | 'miles';
  };
  createdAt: Date;
}

export interface Friend {
  id: string;
  username: string;
  profilePicture?: string;
  status: 'online' | 'offline' | 'playing';
}

export interface FriendRequest {
  id: string;
  from: UserProfile;
  to: UserProfile;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}
