
import { useEffect } from 'react';
import { GameSettings, GameState } from '@/types/game';

export const useGameSettings = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  profile: any
) => {
  // Update distance unit when profile changes
  useEffect(() => {
    if (profile) {
      setGameState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          distanceUnit: profile.default_distance_unit || prev.settings.distanceUnit
        },
        userAvatar: profile.avatar_url
      }));
    }
  }, [profile]);
  
  const handleSettingsChange = (newSettings: GameSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: {
        ...newSettings,
        distanceUnit: profile?.default_distance_unit || newSettings.distanceUnit
      },
      timerRemaining: newSettings.timerEnabled 
        ? newSettings.timerDuration * 60 
        : undefined
    }));
  };
  
  return {
    handleSettingsChange
  };
};

export default useGameSettings;
