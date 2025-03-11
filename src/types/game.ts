
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
}

export interface GameSettings {
  distanceUnit: 'km' | 'miles';
  timerEnabled: boolean;
  timerDuration: number; // in minutes
  gameMode: 'daily' | 'friends';
}

export interface PlayerGuess {
  location: {
    lat: number;
    lng: number;
  } | null;
  year: number;
}

export interface RoundResult {
  event: HistoricalEvent;
  guess: PlayerGuess;
  distanceError: number; // in km
  yearError: number; // in years
  locationScore: number;
  timeScore: number;
  totalScore: number;
}

export interface GameState {
  settings: GameSettings;
  events: HistoricalEvent[];
  currentRound: number;
  totalRounds: number;
  roundResults: RoundResult[];
  gameStatus: 'not-started' | 'in-progress' | 'round-result' | 'game-over';
  currentGuess: PlayerGuess | null;
  timerStartTime?: number; // timestamp when timer started
  timerRemaining?: number; // seconds remaining
  sessionId?: string; // unique ID for the game session
  userAvatar?: string | null; // user's profile picture
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
