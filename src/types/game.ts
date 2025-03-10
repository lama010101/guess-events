
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
}
